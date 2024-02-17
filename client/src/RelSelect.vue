<template>
  <el-select
    ref="selectRef"
    style="width: 128px;"
    v-bind="$attrs"
    :modelValue="props.modelValue"
    @update:modelValue="emit('update:modelValue', pickLP($event))"
    :value-key="rel.prop"
    clearable
    filterable
    remote
    reserve-keyword
    remote-show-suffix
    :remote-method="run"
    :loading="loading"
    :multiple="multiple"
    placeholder="请选择"
  >
  <el-option v-for="opt in toArr(modelValue)" :value="opt" :label="opt[rel.label]" style="display: none;" />
    <el-option v-for="opt in list" :value="opt" :label="opt[rel.label]" />

    <template #footer>
      <div style="text-align: right;">
        <el-button bg text circle @click="open"><i-ep:tools style="opacity: .4;" /></el-button>
      </div>
    </template>
  </el-select>

  <el-dialog v-if="dialog.vis2" v-model="dialog.vis" :title="`选择${ctx().label}`" top="5vh" append-to-body @closed="closed">
    <Table :table="rel.table" v-model:selected="dialog.selected" :tableAttrs="{ rowKey: rel.prop }" :selection="{}" :hasOperation="false" :multiple="multiple">

    </Table>

    <template #footer>
      <div style="text-align: right;">
        <el-button @click="dialog.vis = false">取消</el-button>
        <el-button type="primary" @click="ok">确认</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watchEffect } from 'vue'
import { isArray } from '@vue/shared'
import { Arrayable, toReactive } from '@vueuse/core'
import { useRequest } from 'vue-request'
import { pick } from 'lodash-es'
import Table from './Table.vue'
import { NormalizedField, RelField, Relation } from './props'
import { useConfig } from './context'
import { toArr } from './utils'

type Obj = Record<string, any>

const props = defineProps<{
  modelValue?: Arrayable<Obj>
  multiple?: boolean
  rel: Required<Relation>
}>()

const emit = defineEmits(['update:modelValue'])
const selectRef = ref()

const config = useConfig()
const ctx = () => config.cruds[props.rel.table]

const { data: list, loading, run } = useRequest(
  (str) => {
    const { table, label } = props.rel
    return ctx().finds({ [label]: str })
  },
  { initialData: [], manual: true }
)

const dialog = reactive({
  vis: false,
  vis2: false,
  selected: [] as any[]
})

function open() {
  selectRef.value.blur()
  dialog.vis2 = dialog.vis = true
  dialog.selected = toArr(props.modelValue)
}

function closed() {
  dialog.vis2 = dialog.vis = false
  dialog.selected = []
}

function ok() {
  const { label, prop } = props.rel, { selected } = dialog
  const _pick = e => e && pick(e, [prop, label])
  dialog.vis = false
  const val = pickLP(props.multiple ? selected : selected[0])
  emit('update:modelValue', val)
}

function pickLP(e) {
  const { label, prop } = props.rel
  const _pick = e => e && pick(e, [prop, label])
  return isArray(e) ? e.map(_pick) : _pick(e)
}
</script>