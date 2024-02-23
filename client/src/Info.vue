<template>
  <!-- <el-card class="el-card--small" :header="ctx.label"> -->
    <ElDescriptions border :column="column" style="margin-bottom: 22px;">
    <!-- <ElDescriptionsItem v-for="(col, i) in cols" :label="col.label" :span="i == cols.length - 1 ? column - (i % column) : 1">
      <RelTag v-if="col.relation" :data="getP($data, col.prop)" :rel="col.relation" />
      <template v-else>{{ getP($data, col.prop) }}</template>
    </ElDescriptionsItem>

    <ElDescriptionsItem v-for="col in cols_html" :label="col.label" :span="column">
      <div v-html="getP($data, col.prop)"></div>
    </ElDescriptionsItem> -->

    <ElDescriptionsItem v-for="col in parsed.fields" :label="col.label">
      <RelTag v-if="col.relation" :data="getP($data, col.prop)" :rel="col.relation" />
      <template v-else>{{ getP($data, col.prop) }}</template>
    </ElDescriptionsItem>
  </ElDescriptions>

  <el-card v-for="table in parsed.tables" class="el-card--small" :header="table.label" shadow="nerve" style="margin-bottom: 16px;">
    <Table
      :table="table.table"
      :columns="table.columns"
      :extraQuery="set({ $pageSize: 5 }, pathReverse(ctx, table.prop), pick(data, ctx.map.id))"
      :hasNew="false"
      :searchAttrs="{ size: 'small' }"
      :tableAttrs="{ size: 'small', border: true, tooltipEffect: true }"
      :pagination="{ small: true, layout: 'total, prev, next', style: 'margin: 8px' }"
      :hasOperation="false"
    />
  </el-card>
</template>

<script setup lang="tsx">
import { ref, computed, withDefaults, watchEffect, watch, defineComponent, PropType } from 'vue'
import { toReactive, useBreakpoints, breakpointsTailwind, reactify, reactifyObject } from '@vueuse/core'
import { useRequest } from 'vue-request'
import { ElDescriptions, ElDescriptionsItem } from 'element-plus'
import { set, pick, unionBy } from 'lodash-es'
import { findFieldPath, getP, isRelMany, normalizeField, pathReverse } from './utils'
import RelTag from './RelTag.vue'
import Table from './Table.vue'
import { useConfig } from './context'
import { TableCtx } from './crud'
import { NormalizedField } from './props'

const props = withDefaults(defineProps<{
  ctx: TableCtx
  data: Record<string, any>
  fields: string[]
}>(), {
  data: () => ({})
})

const breakpoints = useBreakpoints(breakpointsTailwind)
const column = computed(() => breakpoints.smallerOrEqual('sm').value ? 2 : 3)

const nFields = computed(() => props.fields?.map(e => normalizeField(e, props.ctx)))

const $data = computed(() => req.data.value || {})
const req = useRequest(({ data, fields }) => props.ctx.find(data, fields), { manual: true })

watch(() => {
  const { data, ctx, fields } = props
  if (!data) return
  const prop = ctx.map.id
  return { data: { [prop]: data[prop] }, fields }
}, v => {
  v && req.run(v)
}, {
  immediate: true
})

const parsed = computed(() => parseFields())

type TableXXX = { table: string; label: string; prop: string; columns: string[] }

function parseFields() {
  const fields = [] as NormalizedField[]
  const tables = {} as Record<string, TableXXX>
  nFields.value.forEach(e => {
    const fs = findFieldPath(props.ctx, e.prop)
    if (!fs.length) return
    const manyI = fs.findIndex(e => e.relation && isRelMany(e.relation.rel))
    if (manyI == -1 || manyI == fs.length - 1) {
      fields.push(e)
    } else {
      const col = fs[manyI], table = col.relation!.table, prop = e.prop.split('.').slice(0, manyI + 1).join('.')
      const tableOpt = tables[prop] ||= { table, label: normalizeField(prop, props.ctx).label, prop, columns: [] }
      tableOpt.columns.push(e.prop.replace(`${prop}.`, ''))
    }
  })
  
  return { fields, tables }
}
</script>

<style scoped lang="scss">
.el-card--small {
  & > :deep(.el-card__body) {
    padding: 0;
  }

  &:deep(.crud-table) {
    &::before { display: none; }
    &::after { display: none; }

    .el-table__inner-wrapper {
      &::before { display: none; }
      // &::after { display: none; }
    }

    .el-table__border-left-patch {
      display: none;
    }
  }
  
  &:deep(.crud-search .el-input) {
    --el-input-width: 100px;
  }
}
</style>