<template>
  <el-tag v-for="item in toArr(data?.[field.prop])" style="cursor: pointer; margin-right: 4px;" @click="onRelInfo(item)">
    {{ item[field.relation!.label] }}
  </el-tag>
</template>

<script setup lang="tsx">
import { computed, createApp, ref, watchEffect } from 'vue'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { useRequest } from 'vue-request'
import { ElDrawer } from 'element-plus'
import { NormalizedField } from './props'
import { useConfig } from './context'
import Info from './Info.vue'

const props = defineProps<{
  field: NormalizedField
  data?: Record<string, any>
}>()

const config = useConfig()

const toArr = val => Array.isArray(val) ? val : (val == null ? [] : [val])

const { data: relInfo, loading, run, runAsync } = useRequest((table, data) => config.cruds[table].find(data), { manual: true })

async function onRelInfo(row) {
  const vis = ref(true)
  const rel = props.field.relation!
  
  // 响应式布局
  const breakpoints = useBreakpoints(breakpointsTailwind)
  const map = { sm: '90%', lg: '75%', '2xl': '50%' }
  const w = computed(() => Object.entries(map).find(([p]) => breakpoints.smaller(p).value)?.[1] || '40%')

  const app = createApp(() => (
    <ElDrawer v-model={vis.value} onClosed={unmount} title={props.field.label} size={w.value}>
      <Info ctx={config.cruds[rel.table]} data={relInfo.value} />
    </ElDrawer>
  ))

  const div = document.createElement('div')
  document.body.append(div)
  app.mount(div)

  function unmount() {
    div.remove()
    app.unmount()
  }

  await runAsync(rel.table, { [rel.prop]: row[rel!.prop] })
}
</script>
