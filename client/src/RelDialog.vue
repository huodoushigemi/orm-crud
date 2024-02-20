<template>
  <el-dialog v-if="state.row" v-model="state.vis" :title="state.field.label" append-to-body top="5vh" width="75%" @closed="state.row = null">
    <Table
      :table="rel.ctx.table"
      :searchs="[rel.field]"
      :extraQuery="{
        [rel.field.prop]: {
          [map.id]: state.row[map.id],
          [map.label]: state.row[rel.field.relation.label] ?? state.row[map.label]
        }
      }"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, computed, shallowReactive } from 'vue'
import { RelField } from './props'
import { useConfig } from './context'
import { TableCtx } from './crud'
import Table from './Table.vue'

const config = useConfig()

const state = shallowReactive({
  vis: false,
  ctx: null as unknown as TableCtx,
  field: null as unknown as RelField,
  row: null,
})

const map = computed(() => state.ctx.map)

const rel = reactive({
  ctx: computed(() => config.cruds[state.field.relation.table]) as unknown as TableCtx,
  field: computed(() => rel.ctx.rels.find(e => e.relation.table == state.ctx.table && e.relation.name == state.field.relation.name && e.prop != state.field.prop)) as unknown as RelField
})

function open(row, ctx: TableCtx, field: RelField) {
  state.vis = true
  state.row = row
  state.ctx = ctx
  state.field = field
}

defineExpose({
  open
})
</script>