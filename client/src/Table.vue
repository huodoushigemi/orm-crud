<script setup lang="ts">
import { computed, ref } from 'vue'
import { toReactive } from '@vueuse/core'
import CRUD from '@el-lowcode/crud'
import { TableXXX } from './props'
import { useConfig } from './context'
import RelSelect from './RelSelect.vue'
import RelTag from './RelTag.vue'

const _props = defineProps<Partial<TableXXX> & {
  table?: string
}>()

CRUD.setConfig({
  field: {
    list: 'list',
    total: 'total',
    page: '$page',
    pageSize: "$pageSize"
  }
})

const config = useConfig()!
const props = toReactive(computed(() => config?.tables[_props.table!] || _props)) as unknown as TableXXX

const ctx = config.cruds[_props.table!]

const searchModel = ref({})
const formModel = ref()

async function request(_, data, type) {
  if (type == 'list') {
    return ctx.page(data)
  }
  if (type == 'new') {
    return await ctx.create(data)
  }
  if (type == 'edit') {
    return await ctx.update(data)
  }
  if (type == 'del') {
    return await ctx.remove(data)
  }
  if (type == 'get') {
    return await ctx.find(data)
  }
}
</script>

<template>
  <CRUD
    v-bind="props"
    :schema="ctx.fields"
    :searchItems="ctx.searchs"
    :formItems="ctx.forms"
    :columns="ctx.columns"
    url="xxx"
    :request="request"
    v-model:search="searchModel"
    v-model:form="formModel"
    :btns="() => [
    ]"
  >
    <template v-for="col in ctx.columns.filter(e => e.relation)" #[col.prop]="{ row }">
      <div>
        <RelTag :field="col" :data="row" />
      </div>
    </template>

    <template v-for="col in ctx.searchs.filter(e => e.relation)" #[`$search:${col.prop}`]="{ row }">
      <RelSelect v-model="row[col.prop]" :field="col" />
    </template>

    <template v-for="col in ctx.forms.filter(e => e.relation)" #[`$form:${col.prop}`]="{ row }">
      <RelSelect v-model="row[col.prop]" :field="col" />
    </template>
  </CRUD>
</template>