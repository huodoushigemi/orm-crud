<template>
  <el-drawer v-if="state.data" v-model="state.vis" :title="state.ctx.label" append-to-body :size="w" :z-index="zIndex" body-style="--el-drawer-padding-primary: 10px" @closed="state.data = null">
    <Info :ctx="state.ctx" :data="state.data" :fields="fields" />

    <template #footer>
      <el-button type="info" text bg @click="() => $refs.xxx.open(state.ctx.table)">
        <i-ep:setting style="font-size: 1.4em;" />
      </el-button>
    </template>
    
    <RelFieldsDialog ref="xxx" v-model="fields" />
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, shallowReactive, ref, watchEffect, watch } from 'vue'
import { toReactive, breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { ElDrawer } from 'element-plus'
import { useZIndex } from 'element-plus/es/hooks/index'
import Info from './Info.vue'
import RelFieldsDialog from './RelFieldsDialog.vue'
import { TableCtx } from './crud'

// 响应式布局
const breakpoints = useBreakpoints(breakpointsTailwind)
const map = { sm: '90%', lg: '75%', '2xl': '60%' }
const w = computed(() => Object.entries(map).find(([p]) => breakpoints.smaller(p).value)?.[1] || '40%')

const fields = ref([])

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
</script>