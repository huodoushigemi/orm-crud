<template>
  <el-dialog v-if="state.vis || state.vis2" v-model="state.vis" title="展示字段" append-to-body :modal="false" width="550px" @open="state.vis2 = true" @close="state.vis2 = false">
    <div class="orm-fields">
      <div class="orm-fields_tags" style="margin-right: 8px;">
        <el-tag v-for="ks in value" :key="ks.join('.')" type="info" size="large" closable @close="remove(modelValue, ks.join('.'))">
          {{ findFieldPath(ctx, ks).map(e => e.label).join(' / ') }}
        </el-tag>
        <el-empty v-if="!value.length" description="no select" image-size="128" />
      </div>
      <el-cascader-panel v-model="value" :options="options" :props="{ value: 'prop', multiple: true, expandTrigger: 'hover', hoverThreshold: 0, checkStrictly: true }" clearable class="orm-fields_menu" />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, shallowReactive } from 'vue'
import { remove } from '@vue/shared'
import { TableCtx } from './crud'
import { findFieldPath, isRelMany } from './utils'
import { NormalizedField, RelField } from './props'
import { useConfig } from './context'

const props = defineProps<{
  modelValue: string[]
}>()

const emit = defineEmits(['update:modelValue'])

const cascaderRef = ref()

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

const options = computed(() => {
  const { ctxs } = ctx.value || {}
  if (!ctxs) return []
  const map = {} as Record<string, NormalizedField[]>
  const rels = <RelField[]>[]
  function rrr(table: string) {
    if (map[table]) map[table]
    const fields = map[table] = <NormalizedField[]>[]
    for (let e of ctxs[table].fields) {
      e = { ...e }
      if (e.relation) rels.push(e)
      fields.push(e)
    }
    while (rels.length) {
      const e = rels.shift()!
      const rel = e.relation
      if (isRelMany(rel.rel)) e.children = ctxs[rel.table].fields.map(e => ({ ...e }))
      else if (map[rel.table]) e.children = map[rel.table].filter(e => !e.relation)
      else e.children = rrr(rel.table)
    }
    return fields
  }
  return rrr(ctx.value.table)
})

function sort(value, opts = options.value) {
  const diff = (a: string[], b: string[], opts: NormalizedField[]) => {
    const ai = opts.findIndex(e => e.prop == a[0]), bi = opts.findIndex(e => e.prop == b[0])
    return (ai - bi) || diff(a.slice(1), b.slice(1), opts[ai].children)
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