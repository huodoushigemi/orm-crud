<template>
  <el-select
    ref="selectRef"
    class="orm-rel-select"
    style="min-width: 128px;"
    v-bind="$attrs"
    v-model="vmodel"
    :value-key="lp[1]"
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
    
    <el-option v-for="opt in list" :value="opt" :label="get(opt, lp[0])" />

    <el-option v-for="(opt, i) in toArr(vmodel)" :value="opt" :label="get(opt, lp[0])" :key="`_${get(opt, lp[1])}`" hidden aria-hidden />

    <!-- <template #footer>
      <div style="text-align: right;">
        <el-button bg text circle @click="open"><i-ep:tools style="opacity: .4;" /></el-button>
      </div>
    </template> -->
  </el-select>

  <el-dialog v-if="dialog.vis2" v-model="dialog.vis" :title="`选择${ctx().label}`" top="5vh" append-to-body @closed="closed">
    <Table :table="_table" v-model:selected="dialog.selected" :tableAttrs="{ rowKey: ctx().map.id }" :selection="{}" :hasOperation="false" :multiple="multiple">

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
import { reactive, ref, watchEffect, computed } from 'vue'
import { isArray } from '@vue/shared'
import { Arrayable } from '@vueuse/core'
import { useRequest } from 'vue-request'
import { Relation, NormalizedField } from '@orm-crud/core'
import { toArr, pickLP, findFieldPath, isRelMany, normalizeField } from '@orm-crud/core/utils'
import { get, set, pick } from 'lodash-es'
import { $ } from './hooks'
import Table from './Table.vue'
import { useConfig } from './context'

type Obj = Record<string, any>

const props = defineProps<{
  modelValue?: Arrayable<Obj>
  multiple?: boolean
  // rel: Required<Relation>
  table: string
  // field: NormalizedField
  valueKey?: string
}>()

const emit = defineEmits(['update:modelValue'])
const selectRef = ref()

const config = useConfig()
const fs = $(() => findFieldPath(config.ctxs[props.table], props.valueKey))
const state = $(() => {
  if (props.valueKey) {
    const fs = findFieldPath(config.ctxs[props.table], props.valueKey)
    if (fs.length == 1) {
      const table = fs[0].relation?.table || props.table
      return {
        table,
        label: config.ctxs[table].map.label,
        prop: config.ctxs[table].map.id,
      }
    } else {
      const temp = fs[fs.length - 1].relation?.table
      const table = temp || fs[fs.length - 2].relation.table
      return {
        table,
        label: config.ctxs[table].map.label,
        prop: temp ? config.ctxs[table].map.id : props.valueKey.split('.').slice(-1)[0],
      }
    }
  } else {
    return {
      table: props.table,
      label: config.ctxs[props.table].map.label,
      prop: config.ctxs[props.table].map.id,
    }
  }
})
const _table = $(() => state().table)
const ctx = () => config.ctxs[_table()]
const lp = $(() => [state().label, state().prop])

const xx = () => {
  if (props.valueKey) {
    const fs = findFieldPath(ctx(), props.valueKey)
    let i = Math.max(fs.findIndex(e => isRelMany(e.relation?.rel)), 0) + 1
    // todo
    i = fs[fs.length - 1].relation ? i : Math.min(i, fs.length - 1)
    return [fs.slice(1, i).map(e => e.prop), fs.slice(i).map(e => e.prop)]
  } else {
    return [[], []]
  }
}

const _get = (e, p) => p.length ? get(e, p) : e
const _set = (p, e) => p.length ? set({}, p, e) : e

const vmodel = computed({
  get() {
    const [fs1, fs2] = xx()
    const v1 = _get(props.modelValue, fs1)
    if (props.multiple) {
      return toArr(v1).map(e => _get(e, fs2))
    } else {
      return _get(toArr(v1)[0], fs2)
    }
  },
  set(v) {
    v = isArray(v) ? v.map(e => pick(e, lp())) : pick(v || null, lp())

    const [fs1, fs2] = xx()
    
    const hasMany = findFieldPath(ctx(), props.valueKey).findIndex(e => isRelMany(e.relation?.rel)) > -1
    if (props.multiple) {
      if (hasMany) {
        emit('update:modelValue', _set(fs1, v.map(e => _set(fs2, e))))
      } else {
        emit('update:modelValue', v.map(e => _set(fs2, e)))
      }
    } else {
      if (hasMany) {
        emit('update:modelValue', fs1.length ? _set(fs1, [_set(fs2, v)]) : _set(fs2, v))
      } else {
        emit('update:modelValue', _set(fs2, v))
      }
    }
  }
})

const { data: list, loading, run } = useRequest(
  (str) => {
    return ctx().api.page({
      where: set({}, lp()[0], str),
      select: lp(),
      // todo
      skip: 0,
      take: 99
    }).then(e => e.list)
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
  // const val = normal(props.multiple ? selected : selected[0])
  // emit('update:modelValue', val)
  vmodel.value = selected
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