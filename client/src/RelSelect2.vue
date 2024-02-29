<template>
  <RelSelect
    :modelValue=""
    :rel="rel()"
    :multiple="multiple"
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
import { toArr, pickLP, findFieldPath } from './utils'
import Table from './Table.vue'
import RelSelect from './RelSelect.vue'

type Obj = Record<string, any>

const props = defineProps<{
  modelValue?: Arrayable<Obj>
  multiple?: boolean
  table: string
  field: RelField
}>()

const emit = defineEmits(['update:modelValue'])
const selectRef = ref()

const config = useConfig()

const ctx = () => config.cruds[props.table]
const rel = () => props.field.relation

const val = computed({
  get: () => get(props.modelValue, props.field.prop),
  set: v => props.multiple
})

function normal(e) {
  if (e === '') e = null
  const { rel } = props
  return isArray(e) ? e.map(e => pickLP(e, rel)) : pickLP(e, rel)
}
</script>
