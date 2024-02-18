<template>
  <el-drawer v-if="state.data" v-model="state.vis" :title="state.ctx.label" append-to-body :size="w" :z-index="zIndex" @closed="state.data = null">
    <Info :ctx="state.ctx" :data="state.data" />

    <template #footer>
      <el-cascader-panel v-model="xxx" :options="options" :props="{ value: 'prop', multiple: true, expandTrigger: 'hover' }" />
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, shallowReactive, ref, watchEffect, watch } from 'vue'
import { toReactive, breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { ElDrawer } from 'element-plus'
import { useZIndex } from 'element-plus/es/hooks/index'
import Info from './Info.vue'
import { TableCtx } from './crud'
import { NormalizedField, RelField } from './props'

// 响应式布局
const breakpoints = useBreakpoints(breakpointsTailwind)
const map = { sm: '90%', lg: '75%', '2xl': '60%' }
const w = computed(() => Object.entries(map).find(([p]) => breakpoints.smaller(p).value)?.[1] || '40%')

const state = shallowReactive({
  vis: false,
  ctx: null as unknown as TableCtx,
  data: null,
})

const { nextZIndex } = useZIndex()
let zIndex = 0
watchEffect(() => state.vis && (zIndex ||= nextZIndex()))

defineExpose({
  open(data, ctx) {
    state.vis = true
    state.data = data
    state.ctx = ctx
  },
  close() {
    state.vis = false
  }
})

const xxx = ref([])

const options = computed(() => {
  const { ctxs } = state.ctx || {}
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
  return rrr(state.ctx.table)
})

watchEffect(() => {
  console.log(options.value);
  // console.log(state.ctx?.table, state.vis);
})
</script>