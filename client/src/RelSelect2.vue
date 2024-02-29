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
import { get, set } from 'lodash-es'
import { RelField, Relation } from './props'
import { useConfig } from './context'
import { toArr, pickLP, findFieldPath, isRelMany } from './utils'
import Table from './Table.vue'
import RelSelect from './RelSelect.vue'

type Obj = Record<string, any>

const props = defineProps<{
  model: Arrayable<Obj>
  table: string
  field: RelField
}>()

const emit = defineEmits(['update:modelValue'])

const config = useConfig()

const ctx = () => config.cruds[props.table]
const rel = () => props.field.relation

const paths = () => findFieldPath(ctx(), props.field.prop)

const xx = () => {
  const fs = paths()
  const i = fs.findIndex(e => isRelMany(e.relation?.rel))
  return [fs.slice(0, i + 1).map(e => e.prop), fs.slice(i + 1).map(e => e.prop)]
}

const multiple = () => paths().some(e => isRelMany(e.relation?.rel))

const val = computed({
  get: () => {
    if (multiple()) {
      const p1 = xx()[0], p2 = xx()[1]
      let ret = get(props.model, p1) || []
      if (p2.length) ret = ret.map(e => get(e, p2))
      return ret
    } else {
      return get(props.model, props.field.prop)
    }
  },
  set: v => {
    if (multiple()) {
      const arr = []
      const p1 = xx()[0], p2 = xx()[1]
      let ret = p1.length > 1 ? set({}, p1.slice(1), arr) : arr
      v?.map((e, i) => set(arr, i + (p2.length ? '.' + p2.join('.') : ''), e))
      props.model[p1[0]] = ret
    } else {
      set({}, props.field.prop, v)
    }
  }
})
</script>
