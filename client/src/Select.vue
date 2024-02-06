<template>
  <el-select
    v-bind="$props"
    @update:modelValue="setRelVal"
    :value-key="field.relation!.prop"
    :multiple="field.relation!.rel == '1-n' || field.relation!.rel == 'm-n'"
    filterable
    remote
    reserve-keyword
    remote-show-suffix
    :remote-method="run"
    :loading="loading"
    :placeholder="`选择${field.label}`"
  >
    <el-option v-for="opt in list" :value="opt" :label="opt[field.relation!.label]" />
  </el-select>
</template>

<script setup lang="ts">
import { Arrayable, useVModel } from '@vueuse/core'
import { isArray } from '@vue/shared'
import { useRequest } from 'vue-request'
import { SelectContext } from 'element-plus'
import { NormalizedField } from './props'
import { useConfig } from './context'

type Obj = Record<string, any>

const props = defineProps<SelectContext['props'] & {
  modelValue?: Arrayable<Obj>
  field: NormalizedField
}>()

const value = useVModel(props, 'modelValue')


const { cruds } = useConfig()!

const { data: list, loading, run } = useRequest((str) => {
  const { table, label } = props.field.relation!
  return cruds[table].finds({ [label]: str })
})

function setRelVal(val) {
  const { field: { relation } } = props
  const { label, prop } = relation!
  if (!val) return value.value = undefined
  const fn = v => ({ [label]: v[label], [prop]: v[prop] })
  value.value = isArray(val) ? val.map(fn) : fn(val)
}
</script>