<template>
  <el-dialog v-if="state.vis || state.vis2" v-model="state.vis" title="展示字段" append-to-body :modal="false" width="512px" @open="state.vis2 = true" @close="state.vis2 = false">
    <el-cascader ref="cascaderRef" v-model="value" :options="options" :props="{ value: 'prop', multiple: true, expandTrigger: 'hover', hoverThreshold: 0, checkStrictly: true }" clearable style="width: 100%;" class="orm-fields" popper-class="orm-fields-menu" />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, shallowReactive } from 'vue'
import { TableCtx } from './crud'
import { findFieldPath } from './utils'
import { NormalizedField, RelField } from './props'
import { useConfig } from './context';

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
      if (map[e.relation.table]) e.children = map[e.relation.table].filter(e => !e.relation)
      else e.children = rrr(e.relation.table)
    }
    return fields
  }
  return rrr(ctx.value.table)
})

function sort(value, opts = options.value) {
  console.log([...value]);
  
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
    setTimeout(() => cascaderRef.value.togglePopperVisible(true), 200);
  }
})
</script>

<style>
.orm-fields-menu .el-cascader-menu__wrap.el-scrollbar__wrap {
  height: 350px;
}

.orm-fields .el-cascader__tags {
  display: flex;
  flex-direction: column;
}
</style>