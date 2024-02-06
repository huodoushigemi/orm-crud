<script setup lang="ts">
import { computed, ref, watchEffect, watchPostEffect } from 'vue'
import { toReactive, objectPick } from '@vueuse/core'
import CRUD from '@el-lowcode/crud'
import { Field, NormalizedField, TableXXX } from './props'
import { useConfig } from './context'
import { isArray, isObject, isPlainObject } from '@vue/shared'
import Select from './Select.vue'

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
      { children: 'xxx' }
    ]"
  >
    <template v-for="col in ctx.columns.filter(e => e.relation)" #[col.prop]="{ row }">
      <el-tag style="cursor: pointer;">{{ row[col.prop]?.[col.relation!.label] }}</el-tag>
    </template>

    <template v-for="col in ctx.searchs.filter(e => e.relation)" #[`$search:${col.prop}`]="{ row }">
      <Select v-model="row[col.prop]" :field="col" />
    </template>

    <template v-for="col in ctx.forms.filter(e => e.relation)" #[`$form:${col.prop}`]="{ row }">
      <Select v-model="row[col.prop]" :field="col" />
    </template>
  </CRUD>
</template>