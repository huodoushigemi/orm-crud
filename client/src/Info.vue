<template>
  <ElDescriptions border :column="column">
    <ElDescriptionsItem v-for="(col, i) in cols" :label="col.label" :span="i == cols.length - 1 ? column - (i % column) : 1">
      <RelTag v-if="col.relation" :field="col" :data="get(data, col.prop)" />
      <template v-else>{{ get(data, col.prop) }}</template>
    </ElDescriptionsItem>

    <ElDescriptionsItem v-for="col in cols_html" :label="col.label" :span="column">
      <div v-html="get(data, col.prop)"></div>
    </ElDescriptionsItem>
  </ElDescriptions>
</template>

<script setup lang="ts">
import { computed, withDefaults } from 'vue'
import { ElDescriptions, ElDescriptionsItem } from 'element-plus'
import { get } from 'lodash-es'
import { TableCtx } from './utils'
import RelTag from './RelTag.vue'

const props = withDefaults(defineProps<{
  ctx: TableCtx
  data: Record<string, any>
}>(), {
  data: () => ({})
})

// const config = useConfig()

// const { data: info, loading, run, runAsync } = useRequest(() => config.cruds[props.ctx.table].find(props.data))
const column = 3

const cols = computed(() => props.ctx.columns.filter(e => !e.html))
const cols_html = computed(() => props.ctx.columns.filter(e => e.html))
</script>
