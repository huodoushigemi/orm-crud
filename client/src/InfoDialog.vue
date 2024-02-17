<template>
  <el-drawer v-if="curr" v-model="vis" append-to-body :size="w" :z-index="zIndex" @closed="curr = null">
    <Info :ctx="ctx" :data="curr" />
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { toReactive, breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { ElDrawer } from 'element-plus'
import { useZIndex } from 'element-plus/es/hooks/index'
import Info from './Info.vue'
import { TableCtx } from './crud'

const props = defineProps<{
  ctx: TableCtx
}>()

// 响应式布局
const breakpoints = useBreakpoints(breakpointsTailwind)
const map = { sm: '90%', lg: '75%', '2xl': '50%' }
const w = computed(() => Object.entries(map).find(([p]) => breakpoints.smaller(p).value)?.[1] || '40%')

const vis = ref(false), curr = ref()

const { nextZIndex } = useZIndex()
let zIndex = 0
watchEffect(() => vis.value && (zIndex ||= nextZIndex()))

defineExpose({
  open(data) {
    vis.value = true
    curr.value = data
  },
  close() {
    vis.value = false
  }
})
</script>