<script setup lang="ts">
import { reactive, computed, ref, watchEffect, watch } from 'vue'
import { isArray, isString } from '@vue/shared'
import CRUD from '@el-lowcode/crud'
import { ElFormItemRender } from 'el-form-render'
import { NormalizedField, TableOpt } from '@orm-crud/core'
import { getP, normalizeField } from '@orm-crud/core/utils'
import RelTag from './RelTag.vue'
import InfoDialog from './InfoDialog.vue'
import RelDialog from './RelDialog.vue'
import ContextMenu from './ContextMenu.vue'
import { useConfig } from './context'
import EditDialog from './EditDialog.vue'
import { $, useDialogBind, useStorage } from './hooks'
import Select from './Select.vue'
import FieldsDialog from './FieldsDialog.vue'

import IEdite from '~icons/ep/edit'
import IDelete from '~icons/ep/delete'
import IDocument from '~icons/ep/document'

const props = withDefaults(defineProps<Partial<TableOpt> & {
  table: string
  hasNew?: boolean
}>(), {
  hasNew: true
})

CRUD.setConfig({
  field: {
    list: 'list',
    total: 'total',
    page: '$page',
    pageSize: "$pageSize"
  }
})

const config = useConfig()
const ctx = () => config.ctxs[props.table]

const _searchs = $(() => [
  ...props.searchs?.map(e => normalizeField(ctx(), e)).filter(e => ctx().searchs.every(ee => ee.prop != e.prop)) || [],
  ...ctx().searchs
])

const colsDefaults = () => ctx().columns.map(e => isString(e) ? e : e.prop)
const cols = useStorage(() => `orm-columns-select_${props.table}`, { default: colsDefaults })
const _columns = computed(() => (props.columns || cols.value).map(e => normalizeField(ctx(), e)))

const formatter = (row, col: NormalizedField, val) => {
  const findLabel = (e) => col.options!.find(e => e.value == val)?.label || val
  return col.options
    ? isArray(val) ? val.map(findLabel) : findLabel(val)
    : val
}

const searchModel = ref({})

async function request(_, data, type) {
  if (type == 'list') {
    return ctx().api.page({
      where: { ...data, $page: undefined, $pageSize: undefined },
      select: _columns.value.map(e => isString(e) ? e : e.prop),
      skip: (data.$page - 1) * data.$pageSize,
      take: data.$pageSize
    })
  }
  if (type == 'get') {
    return await ctx().api.find({ where: data })
  }
  if (type == 'new') {
    return await ctx().api.create(data)
  }
  if (type == 'edit') {
    return await ctx().api.update(data)
  }
  if (type == 'del') {
    return await ctx().api.remove(data)
  }
}

watch(_columns, () => crudRef.value.getData())

const crudRef = ref()
const fieldsBind = useDialogBind()
const infoBind = useDialogBind()
const editBind = useDialogBind()
const relBind = useDialogBind({ prop: '' })

const menu = reactive({ vis: false, row: null, x: 0, y: 0 })
const menus = computed(() => [
  { title: '详情', icon: IDocument, onClick: () => infoBind.data = menu.row },
  { title: '编辑', icon: IEdite, onClick: () => editBind.data = menu.row },
  { title: '删除', icon: IDelete, disabled: true, divided: true, onClick: () => infoBind.data = menu.row },
  { title: '关联的表', children: ctx().rels.map(e => ({ title: e.label, onClick: () => Object.assign(relBind, { data: menu.row, prop: e.prop }) })) }
])
watchEffect(() => menu.vis || (menu.row = null))
async function openMenu(row, col, e: MouseEvent) {
  e.preventDefault()
  menu.vis = false
  menu.row = null
  setTimeout(() => {
    menu.vis = true
    menu.row = row
    menu.x = e.clientX
    menu.y = e.clientY
  }, 50);
}

const log = (...arg) => console.log(...arg)
</script>

<template>
  <!-- {{ JSON.parse(JSON.stringify(searchModel)) }} -->
  <div class="orm-table">
    <CRUD
      v-bind="{ ...$attrs, class: null, style: null }"
      ref="crudRef"
      class="orm-table_table"
      :schema="ctx().fields"
      :columns="_columns"
      url="xxx"
      :request="request"
      v-model:search="searchModel"
      :hasNew="false"
      :hasOperation="false"
      :tableAttrs="{
        rowKey: ctx().map.id,
        cellStyle: ({ row }) => row == menu.row ? { 'background-color': 'var(--el-table-current-row-bg-color)' } : undefined,
        onRowContextmenu: openMenu,
        ...$attrs.tableAttrs
      }"
    >
      <template v-for="col in _columns" #[`$${col.prop}`]="{ row }">
        <div v-if="col.relation">
          <RelTag :data="getP(row, col.prop)" :rel="col.relation!" />
        </div>
        <template v-else>
          {{ formatter(row, col, getP(row, col.prop)) }}
        </template>
      </template>
  
      <!-- <template v-for="col in _searchs.filter(e => e.relation)" #[`search:${col.prop}`]="{ row }">
        <RelSelect2 :modelValue2="get(col.prop)" :table="table" :model="row" :raw="{}" :field="col" />
      </template> -->

      <template #search>
        <template v-for="col in _searchs">
          <ElFormItemRender v-if="col.relation" v-bind="col" :prop="col.prop.split('.')[0]">
            <Select v-model="searchModel[col.prop.split('.')[0]]" :table="table" :valueKey="col.prop" />
          </ElFormItemRender>
          <ElFormItemRender v-else v-bind="col" />
        </template>
      </template>

      <template v-if="hasNew" #header>
        <el-button type="primary" @click="editBind.data = {}">新增</el-button>
        <el-button type="info" text bg @click="fieldsBind.vis = true"><i-ep:setting /></el-button>
      </template>
    </CRUD>

    <FieldsDialog v-if="fieldsBind.showing" v-bind="fieldsBind" :table="table" v-model:data="cols" :defaults="colsDefaults" />
  
    <InfoDialog v-if="infoBind.showing" v-bind="infoBind" :table="table" />

    <EditDialog v-if="editBind.showing" v-bind="editBind" :table="table" @finish="crudRef.getData()" />
  
    <RelDialog v-if="relBind.showing" v-bind="relBind" :table="table" />
  
    <ContextMenu v-model="menu.vis" :menus="menus" :x="menu.x" :y="menu.y" />
  </div>
</template>

<style lang="scss">
.orm-table {
  display: flex;

  &_table {
    flex: 1;
    width: 0;
  }

  .crud-search.el-form--inline {
    .el-select {
      min-width: 128px;
    }
  }
}

.crud > .el-table .cell > .el-checkbox {
  --el-checkbox-input-height: 16px;
  --el-checkbox-input-width: 16px;

  .el-checkbox__inner {
    &::after {
      display: none;
    }
  }
}

.crud-search {
  .el-input {
    --el-input-width: 180px;
  }
}
</style>