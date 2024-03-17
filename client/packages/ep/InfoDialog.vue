<template>
  <el-drawer v-bind="$attrs" :title="ctx().label" append-to-body :size="w" :z-index="zIndex" body-style="--el-drawer-padding-primary: 10px">
    <Info :table="table" :data="data" :select="select" />

    <template #footer>
      <el-button type="info" text bg @click="fieldsBind.vis = true">
        <i-ep:setting style="font-size: 1.4em;" />
      </el-button>
    </template>
    
    <FieldsDialog v-if="fieldsBind.showing" v-bind="fieldsBind" :table="table" v-model:data="select" :defaults="defaults" />
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { useZIndex } from 'element-plus/es/hooks/index'
import { useStorage, useDialogBind } from './hooks'
import Info from './Info.vue'
import FieldsDialog from './FieldsDialog.vue'
import { useConfig } from './context'

const props = defineProps<{
  table: string
  data: any
}>()

const config = useConfig()
const ctx = () => config.ctxs[props.table]

// 响应式布局
const breakpoints = useBreakpoints(breakpointsTailwind)
const map = { sm: '90%', lg: '75%', '2xl': '60%' }
const w = computed(() => Object.entries(map).find(([p]) => breakpoints.smaller(p).value)?.[1] || '40%')

const defaults = () => ctx().views.map(e => e.prop)
const fieldsBind = useDialogBind()

const select = useStorage(
  () => `orm-views-select_${ctx().table}`,
  { default: defaults }
)

const { nextZIndex } = useZIndex()
let zIndex = 0
watchEffect(() => props.data && (zIndex ||= nextZIndex()))
</script>