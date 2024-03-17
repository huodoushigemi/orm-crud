<template>
  <el-dialog v-bind="$attrs" append-to-body :modal="false" width="550px" draggable style="resize: horizontal; overflow: auto;">
    <template #header>
      <span class="el-dialog__title">选择字段</span>
      <el-button text bg size="small" style="margin-left: 12px; opacity: .75;" @click="emit('update:data', defaults())">还原</el-button>
    </template>
    <div class="orm-fields">
      <div class="orm-fields_tags" style="margin-right: 8px;">
        <el-tag v-for="ks in value" :key="ks.join('.')" type="info" size="large" closable @close="remove(data, ks.join('.'))">
          {{ findFieldPath(ctx, ks).map(e => e.label).join(' / ') }}
        </el-tag>
        <el-empty v-if="!value.length" description="no select" image-size="128" />
      </div>
      <el-cascader-panel v-model="value" :options="options" :props="{ value: 'prop', multiple: true, hoverThreshold: 0, checkStrictly: true }" clearable class="orm-fields_menu" />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { CascaderProps } from 'element-plus'
import { remove } from '@vue/shared'
import { pick } from 'lodash-es'
import { Field, NormalizedField, TableCtx } from '@orm-crud/core'
import { findFieldPath } from '@orm-crud/core/utils'
import { $ } from './hooks'
import { useConfig } from './context'

const props = defineProps<{
  table: string
  data: string[]
  defaults: () => string[]
  filter?: (ctx: TableCtx, field: NormalizedField, queue: NormalizedField[]) => boolean
  processOpt?: (ctx: TableCtx, field: NormalizedField, queue: NormalizedField[]) => Partial<CascaderProps> | undefined
  maxDeep?: number
}>()

const emit = defineEmits(['update:data'])

const config = useConfig()
const ctx = $(() => config.ctxs[props.table])

const value = $(
  () => props.data.map(e => e.split('.')),
  (v) => emit('update:data', sort(v).map(e => e.join('.'))),
)

type Opt = Pick<Field, 'label' | 'prop' | 'relation'> & { children?: Opt[]; disabled: any }

const options = $(() => {
  const { filter = () => true, processOpt, maxDeep = 3 } = props
  const { ctxs } = ctx() || {}
  const _pick = (v: Field) => pick(v, 'label', 'prop', 'relation') as Opt
  if (!ctxs) return []
  // 递归
  return (function rrr(table: string, queue = <NormalizedField[]>[]) {
    const ret = <Opt[]>[]
    const ctx = ctxs[table]
    ctx.fields.forEach(e => {
      const item = _pick(e)
      
      if (e.relation) {
        const xx = [`${e.relation.table}.${e.inverseSide!.prop}`, `${table}.${e.prop}`]
        if (queue.some(ee => xx.includes(`${ee.inverseSide!.table}.${ee.prop}`))) return 
      }
      

      queue.push(e)
      
      if (processOpt) {
        Object.assign(item, processOpt(ctx, e, queue))
      }
      if (filter(ctx, e, queue)) {
        ret.push(item)
        if (queue.length < maxDeep && item.relation) item.children = rrr(item.relation.table, queue)
      }
      queue.pop()
    })
    return ret
  })(props.table)
})

function sort(value, opts = options.value) {
  const diff = (a: string[], b: string[], opts: Opt[]) => {
    const ai = opts.findIndex(e => e.prop == a[0]), bi = opts.findIndex(e => e.prop == b[0])
    return (ai - bi) || diff(a.slice(1), b.slice(1), opts[ai].children!)
  }
  value.sort((a, b) => diff(a, b, opts))
  return value
}
</script>

<style lang="scss">
.orm-fields {
  display: flex;
  height: 400px;

  &_tags {
    display: flex;
    flex-direction: column;
    margin-right: 8px;
    padding: 8px;
    width: 150px;
    overflow: auto;
    border: 1px solid var(--el-border-color-light);

    > .el-tag {
      flex-shrink: 0;
      justify-content: unset;
      margin-bottom: 4px;
      border-color: transparent;

      > .el-tag__close {
        margin-left: auto;
      }
    }
  }

  &_menu {
    flex: 1;
    width: 0;
    overflow: auto;

    > .el-cascader-menu {
      min-width: 150px;
      flex-shrink: 0;
    }

    .el-cascader-menu:last-child .el-cascader-node {
      padding-right: 30px;
    }

    .el-cascader-node {
      font-weight: unset !important;
    }

    .el-cascader-menu__wrap.el-scrollbar__wrap {
      height: 100%;
    }
  }
}

.orm-fields .el-cascader__tags {
  display: flex;
  flex-direction: column;
}
</style>