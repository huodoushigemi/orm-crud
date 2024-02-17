<template>
  <el-select
    style="width: 128px;"
    v-bind="$attrs"
    v-model="value"
    clearable
    filterable
    remote
    reserve-keyword
    remote-show-suffix
    :remote-method="run"
    :loading="loading"
    placeholder="请选择"
  >
    <el-option v-for="opt in _list" :value="opt[rel.prop]" :label="opt[rel.label]" />
  </el-select>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { isArray } from '@vue/shared'
import { Arrayable, toReactive } from '@vueuse/core'
import { useRequest } from 'vue-request'
import { NormalizedField, RelField, Relation } from './props'
import { useConfig } from './context'

type Obj = Record<string, any>

const props = defineProps<{
  modelValue?: Arrayable<Obj>
  rel: Required<Relation>
}>()

const emit = defineEmits(['update:modelValue'])

const value = computed({
  get() {
    const val = props.modelValue, { prop } = props.rel
    return val == null ? val : isArray(val) ? val.map(e => e[prop]) : val[prop]
  },
  set(val) {
    if (val === '') val = undefined
    const { prop } = props.rel
    emit('update:modelValue', val == null ? val : isArray(val) ? val.map(e => ({ [prop]: e })) : { [prop]: val })
  }
})

const config = useConfig()

const { data: list, loading, run } = useRequest(
  (str) => {
    const { table, label } = props.rel
    return config.cruds[table].finds({ [label]: str })
  },
  { initialData: [], manual: true }
)

const _list = computed(() => {
  const val = props.modelValue
  if (!val) return list.value
  const { prop } = props.rel
  const opt = list.value!.find(e => e[prop] == val[prop])
  return opt ? list.value : [val, ...list.value!]
})
</script>