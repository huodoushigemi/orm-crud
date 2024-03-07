<template>
  <el-dialog v-if="data" v-bind="$attrs" :title="relCtx().label" append-to-body top="5vh" width="75%">
    <Table
      :table="relCtx().table"
      :searchs="[reversedProp()]"
      :extraQuery="set({}, reversedProp(), pick(data, [reversedRel().prop, reversedRel().label]))"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, computed, shallowReactive } from 'vue'
import { NormalizedField, RelField } from './props'
import { useConfig } from './context'
import { TableCtx } from './crud'
import { findFieldPath, normalizeField, pathReverse } from './utils'
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
  let table = normalizeField(ctx(), props.prop).relation!.table
  const _ctx = config.ctxs[table]
  if (_ctx.middle) {
    return props.prop + '.' + _ctx.rels.find(e => e.relation.table != props.table)!.prop
  } else {
    return props.prop
  }
})

const relCtx = $(() => config.ctxs[normalizeField(ctx(), _prop()).relation!.table])

const reversedProp = $(() => pathReverse(ctx(), _prop()))
const reversedField = $(() => normalizeField(relCtx(), reversedProp()))
const reversedRel = $(() => reversedField().relation!)

</script>