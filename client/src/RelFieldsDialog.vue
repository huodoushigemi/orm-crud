<template>
  <el-dialog v-if="state.vis || state.vis2" v-model="state.vis" title="展示字段" append-to-body :modal="false" width="550px" @open="state.vis2 = true" @close="state.vis2 = false">
    <template #header>
      <span class="el-dialog__title">展示字段</span>
      <el-button text bg size="small" style="margin-left: 12px; opacity: .75;" @click="emit('update:modelValue', defaults())">还原</el-button>
    </template>
    <div class="orm-fields">
      <div class="orm-fields_tags" style="margin-right: 8px;">
        <el-tag v-for="ks in value" :key="ks.join('.')" type="info" size="large" closable @close="remove(modelValue, ks.join('.'))">
          {{ findFieldPath(ctx, ks).map(e => e.label).join(' / ') }}
        </el-tag>
        <el-empty v-if="!value.length" description="no select" image-size="128" />
      </div>
      <el-cascader-panel v-model="value" :options="options" :props="{ value: 'prop', multiple: true, hoverThreshold: 0, checkStrictly: true }" clearable class="orm-fields_menu" />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, shallowReactive } from 'vue'
import { remove } from '@vue/shared'
import { TableCtx } from './crud'
import { findFieldPath, isRelMany } from './utils'
import { Field, NormalizedField, RelField } from './props'
import { useConfig } from './context'
import { pick } from 'lodash-es'

const props = defineProps<{
  modelValue: string[]
  defaults: () => string[]
  filter?: (ctx: TableCtx, field: NormalizedField, deep: number) => boolean
  maxDeep?: number
}>()

const emit = defineEmits(['update:modelValue'])

const config = useConfig()

const state = shallowReactive({
  vis: false,
  vis2: false,
  table: '',
})

const ctx = computed(() => config.cruds[state.table])

const value = computed({
  get: () => props.modelValue.map(e => e.split('.')),
  set: (v) => emit('update:modelValue', sort(v).map(e => e.join('.'))),
})

type Opt = Pick<Field, 'label' | 'prop' | 'relation'> & { children?: Opt[] }

const options = computed(() => {
  const { filter, maxDeep = 3 } = props
  const { ctxs } = ctx.value || {}
  const _pick = (v: Field) => pick(v, 'label', 'prop', 'relation') as Opt
  if (!ctxs) return []
  // 递归
  return (function rrr(table: string, deep = 1) {
    const ctx = ctxs[table]
    let fields = ctx.fields
    if (filter) fields = fields.filter(e => filter(ctx, e, deep))
    return fields.map(e => {
      const item = _pick(e)
      if (deep < maxDeep && item.relation) item.children = rrr(item.relation.table, deep + 1)
      return item
    })
  })(state.table)
})

function sort(value, opts = options.value) {
  const diff = (a: string[], b: string[], opts: Opt[]) => {
    const ai = opts.findIndex(e => e.prop == a[0]), bi = opts.findIndex(e => e.prop == b[0])
    return (ai - bi) || diff(a.slice(1), b.slice(1), opts[ai].children!)
  }
  value.sort((a, b) => diff(a, b, opts))
  return value
}

defineExpose({
  open(table) {
    state.vis = true
    state.table = table
  }
})
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