<template>
  <RelSelect
    v-model="val"
    :rel="rel()"
    :multiple="multiple()"
  />
</template>

<script setup lang="tsx">
import { computed, reactive, ref, watchEffect } from 'vue'
import { isArray } from '@vue/shared'
import { Arrayable } from '@vueuse/core'
import { useRequest } from 'vue-request'
import { get, keyBy, set } from 'lodash-es'
import { RelField } from '@orm-crud/core'
import { toArr, pickLP, findFieldPath, isRelMany } from '@orm-crud/core/utils'
import { useConfig } from './context'
import Table from './Table.vue'
import RelSelect from './RelSelect.vue'

type Obj = Record<string, any>

const props = defineProps<{
  model: Arrayable<Obj>
  raw: Arrayable<Obj>
  table: string
  field: RelField
}>()

const emit = defineEmits(['update:modelValue'])

const config = useConfig()

const ctx = () => config.ctxs[props.table]
const rel = () => props.field.relation

const paths = () => findFieldPath(ctx(), props.field.prop)

const xx = () => {
  const fs = paths()
  const i = fs.findIndex(e => isRelMany(e.relation?.rel))
  return [fs.slice(0, i + 1).map(e => e.prop), fs.slice(i + 1).map(e => e.prop)]
}

const multiple = () => paths().some(e => isRelMany(e.relation?.rel))

const rawKeybyed = computed(() => keyBy(toArr(getVal(props.raw)), rel().prop))

const val = computed({
  get: () => {
    console.log(getVal(props.model));
    
    return getVal(props.model)
  },
  set: v => {
    if (multiple()) {
      const p1 = xx()[0], p2 = xx()[1]
      const _get = (e, p) => p.length ? get(e, p) : e
      const _set = (p, e) => p.length ? set({}, p, e) : e

      let keybyed = keyBy(v, rel().prop)
      const arr = get(props.raw, p1)?.filter(e => keybyed[_get(e, p2)[rel().prop]]) || []
      keybyed = keyBy(arr, p2.concat(rel().prop).join('.'))
      v = v.filter(e => !keybyed[e[rel().prop]])
      v.forEach(e => arr.push(_set(p2, e)))

      set(props.model, p1, arr)
    } else {
      set({}, props.field.prop, v)
    }
  }
})

function getVal(data) {
  if (multiple()) {
    const p1 = xx()[0], p2 = xx()[1]
    let ret = toArr(get(data, p1))
    if (p2.length) ret = ret.map(e => get(e, p2))
    return ret
  } else {
    return get(data, props.field.prop)
  }
}
</script>
