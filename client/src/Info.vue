<template>
  <ElDescriptions border :column="column">
    <ElDescriptionsItem v-for="(col, i) in cols" :label="col.label" :span="i == cols.length - 1 ? column - (i % column) : 1">
      <RelTag v-if="col.relation" :data="getP($data, col.prop)" :rel="col.relation" />
      <template v-else>{{ getP($data, col.prop) }}</template>
    </ElDescriptionsItem>

    <ElDescriptionsItem v-for="col in cols_html" :label="col.label" :span="column">
      <div v-html="getP($data, col.prop)"></div>
    </ElDescriptionsItem>
  </ElDescriptions>
</template>

<script setup lang="ts">
import { computed, withDefaults, watchEffect } from 'vue'
import { toReactive, useBreakpoints, breakpointsTailwind } from '@vueuse/core'
import { useRequest } from 'vue-request'
import { ElDescriptions, ElDescriptionsItem } from 'element-plus'
import { getP } from './utils'
import RelTag from './RelTag.vue'
import { useConfig } from './context'
import { TableCtx } from './crud'
import { pick } from 'lodash-es'

const props = withDefaults(defineProps<{
  ctx: TableCtx
  data: Record<string, any>
  fields: string[]
}>(), {
  data: () => ({})
})

const breakpoints = useBreakpoints(breakpointsTailwind)
const column = computed(() => breakpoints.smallerOrEqual('sm').value ? 2 : 3)

const cols = computed(() => props.ctx.columns.filter(e => !e.html))
const cols_html = computed(() => props.ctx.columns.filter(e => e.html))

const $data = computed(() => req.data.value || {})
const req = useRequest(() => {
  const { data, ctx, fields } = props
  if (!data) return
  const prop = ctx.map.id
  return ctx.find({ [prop]: data[prop] }, fields)
}, { refreshDeps: () => [props.fields, props.data] })
</script>
