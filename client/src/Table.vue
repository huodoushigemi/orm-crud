<script setup lang="ts">
import { computed, ref, watchEffect, watchPostEffect } from 'vue';
import { useRequest, usePagination } from 'vue-request'
import { toReactive, objectPick } from '@vueuse/core'
import { Field, NormalizedField, TableXXX } from './props'
import { useConfig } from './context';
import CRUD from '@el-lowcode/crud';
import { isArray, isObject, isPlainObject } from '@vue/shared';
import { createCruds } from './prisma'

const _props = defineProps<Partial<TableXXX> & {
  table?: string
}>()

const config = useConfig()!
const props = toReactive(computed(() => config?.tables[_props.table!] || _props)) as unknown as TableXXX

const cruds = createCruds(config.tables)
const ctx = cruds[_props.table!]


// watchPostEffect(() => {
//   console.log(
//     JSON.parse(JSON.stringify(cruds[_props.table!].find(searchModel.value)?.argv || null))
//   );
//   console.log(
//     JSON.parse(JSON.stringify(cruds[_props.table!].finds(searchModel.value)?.argv || null))
//   );
//   console.log(
//     JSON.parse(JSON.stringify(cruds[_props.table!].create(formModel.value || {}).argv || null))
//   );
//   console.log(
//     JSON.parse(JSON.stringify(cruds[_props.table!].update(searchModel.value)?.argv || null))
//   );
// })

// const { data } = useRequest((data) => cruds[_props.table!].finds(data))
// const {} = usePagination()

const searchModel = ref({})
const formModel = ref()

async function request(_, data, type) {
  if (type == 'list') {
    return {
      data: {
        total: await cruds[_props.table!].count(data),
        list: await cruds[_props.table!].finds(data),
      }
    }
  }
  if (type == 'new') {
    console.log(...arguments);
    return await cruds[_props.table!].create(data)
  }
}

const options = [
  { title: '1', id: '1' },
  { title: '2', id: '2' },
  { title: '3', id: '3' },
]

function setRelVal(field: NormalizedField, row, val) {
  if (!val) return row[field.prop] = undefined
  const fn = v => ({ [field.relation!.prop]: v[field.relation!.prop] })
  row[field.prop] = isArray(val) ? val.map(fn) : fn(val)
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
      <el-tag>{{ row[col.relation!.table]?.[col.relation!.label] }}</el-tag>
    </template>
    <template v-for="col in ctx.forms.filter(e => e.relation)" #[`$form:${col.prop}`]="{ row }">
      <el-select :modelValue="row[col.prop]" @update:modelValue="setRelVal(col, row, $event)" :value-key="col.relation!.prop">
        <el-option v-for="opt in options" :value="opt" :label="opt[col.relation!.label]" />
      </el-select>
    </template>
  </CRUD>
</template>