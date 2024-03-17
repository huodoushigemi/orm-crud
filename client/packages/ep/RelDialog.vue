<template>
  <el-dialog v-bind="$attrs" :title="relCtx.label" class="orm-dialog" append-to-body top="5vh" width="75%" draggable>
    <Table
      :table="relCtx.table"
      :searchs="[reversedProp]"
      :extraQuery="set({}, reversedProp, pick(data, [reversedRel.prop, reversedRel.label]))"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { normalizeField, pathReverse } from '@orm-crud/core/utils'
import { useConfig } from './context'
import Table from './Table.vue'
import { pick, set } from 'lodash-es'
import { $ } from './hooks'

const props = defineProps<{
  table: string
  data: any
  prop: string
}>()

const config = useConfig()
const ctx = () => config.ctxs[props.table]

const _prop = $(() => {
  let relTable = normalizeField(ctx(), props.prop).relation!.table
  const relCtx = config.ctxs[relTable]
  if (relCtx.middle) {
    return props.prop + '.' + relCtx.rels.find(e => e.relation.table != props.table)!.prop
  } else {
    return props.prop
  }
})

const relCtx = $(() => config.ctxs[normalizeField(ctx(), _prop()).relation!.table])

const reversedProp = $(() => pathReverse(ctx(), _prop()))
const reversedField = $(() => normalizeField(relCtx(), reversedProp()))
const reversedRel = $(() => reversedField().relation!)

</script>