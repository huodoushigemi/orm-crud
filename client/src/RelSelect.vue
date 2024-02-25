<template>
  <el-select
    ref="selectRef"
    class="orm-rel-select"
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
    <template #prefix>
      <i-ep:full-screen class="orm-rel-select_expand" @click="open" />
    </template>
    
    <el-option v-for="opt in list" :value="opt" :label="get(opt, rel.label)" />

    <el-option v-for="(opt, i) in toArr(modelValue)" :value="opt" :label="get(opt, rel.label)" :key="`_${i}`" hidden aria-hidden />

    <!-- <template #footer>
      <div style="text-align: right;">
        <el-button bg text circle @click="open"><i-ep:tools style="opacity: .4;" /></el-button>
      </div>
    </template> -->
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

<script setup lang="tsx">
import { computed, h, reactive, ref, watchEffect } from 'vue'
import { isArray } from '@vue/shared'
import { Arrayable, toReactive } from '@vueuse/core'
import { useRequest } from 'vue-request'
import { get, set } from 'lodash-es'
import Table from './Table.vue'
import { NormalizedField, RelField, Relation } from './props'
import { useConfig } from './context'
import { toArr, pickP } from './utils'

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
    const { label } = props.rel
    return ctx().finds(set({}, label, str))
  },
  { initialData: [], manual: true }
)

const dialog = reactive({
  vis: false,
  vis2: false,
  selected: [] as any[]
})

function open(e) {
  e.stopPropagation()
  selectRef.value.blur()
  dialog.vis2 = dialog.vis = true
  dialog.selected = toArr(props.modelValue)
}

function closed() {
  dialog.vis2 = dialog.vis = false
  dialog.selected = []
}

function ok() {
  const { selected } = dialog
  dialog.vis = false
  const val = pickLP(props.multiple ? selected : selected[0])
  emit('update:modelValue', val)
}

function pickLP(e) {
  if (e === '') e = null
  const { label, prop } = props.rel
  const _pick = e => e && pickP(e, [prop, label])
  return isArray(e) ? e.map(_pick) : _pick(e)
}
</script>

<style lang="scss">
.orm-rel-select {
  .orm-rel-select_expand {
    padding: 0 4px;
    width: 1.4em;
    height: 100%;
  }

  .el-select__prefix {
    margin: -3px 0 -3px -4px;
    // padding: 0 4px;
    border-radius: var(--el-border-radius-base);
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    opacity: .4;
    cursor: pointer;

    &:hover {
      background-color: var(--el-fill-color-light);
      opacity: 1;
    }
  }

  .el-select__wrapper {
    padding-left: 5px;
    align-items: unset;
  }
}
</style>