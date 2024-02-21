<script setup lang="ts">
import { reactive, computed, ref, watchEffect } from 'vue'
import { toReactive } from '@vueuse/core'
import CRUD from '@el-lowcode/crud'
import RelSelect from './RelSelect.vue'
import RelOptions from './RelOptions.vue'
import RelTag from './RelTag.vue'
import InfoDialog from './InfoDialog.vue'
import RelDialog from './RelDialog.vue'
import ContextMenu from './ContextMenu.vue'
import { TableOpt } from './props'
import { useConfig } from './context'
import { getP, normalizeField } from './utils'

import IEdite from '~icons/ep/edit'
import IDelete from '~icons/ep/delete'
import IDocument from '~icons/ep/document'

defineOptions({  })

const props = defineProps<Partial<TableOpt> & {
  table: string
}>()

CRUD.setConfig({
  field: {
    list: 'list',
    total: 'total',
    page: '$page',
    pageSize: "$pageSize"
  }
})

const config = useConfig()
const ctx = () => config.cruds[props.table]

const _searchs = computed(() => [
  ...props.searchs?.map(e => normalizeField(e, ctx())).filter(e => ctx().searchs.every(ee => ee.prop != e.prop)) || [],
  ...ctx().searchs
])

const searchModel = ref({})
const formModel = ref()

async function request(_, data, type) {
  if (type == 'list') {
    return ctx().page(data)
  }
  if (type == 'new') {
    return await ctx().create(data)
  }
  if (type == 'edit') {
    return await ctx().update(data)
  }
  if (type == 'del') {
    return await ctx().remove(data)
  }
  if (type == 'get') {
    return await ctx().find(data)
  }
}

const infoRef = ref()
const relRef = ref()
const crudRef = ref()

const menu = reactive({ vis: false, row: null, x: 0, y: 0 })
const menus = computed(() => [
  { title: '详情', icon: IDocument, onClick: () => infoRef.value.open(menu.row, ctx()) },
  { title: '编辑', icon: IEdite, onClick: () => crudRef.value.openDialog(menu.row) },
  { title: '删除', icon: IDelete, disabled: true, divided: true, onClick: () => infoRef.value.open(menu.row, ctx()) },
  { title: '关联的表', children: ctx().rels.map(e => ({ title: e.label, onClick: () => relRef.value.open(menu.row, ctx(), e) })) }
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
      :searchItems="_searchs"
      :formItems="ctx().forms"
      :columns="ctx().columns.map(e => ({ ...e, formatter: row => getP(row, e.prop) }))"
      url="xxx"
      :request="request"
      v-model:search="searchModel"
      v-model:form="formModel"
      :btns="() => []"
      :tableAttrs="{
        rowKey: ctx().map.id,
        cellStyle: ({ row }) => row == menu.row ? { 'background-color': 'var(--el-table-current-row-bg-color)' } : undefined,
        onRowContextmenu: openMenu,
        ...$attrs.tableAttrs
      }"
    >
      <template v-for="col in ctx().columns.filter(e => e.relation)" #[`$${col.prop}`]="{ row }">
        <div>
          <RelTag :data="getP(row, col.prop)" :rel="col.relation!" />
        </div>
      </template>
  
      <template v-for="col in _searchs.filter(e => e.relation)" #[`search:${col.prop}`]="{ row }">
        <RelSelect v-model="row[col.prop]" :rel="col.relation!" />
      </template>
  
      <template v-for="col in ctx().forms.filter(e => e.relation)" #[`form:${col.prop}`]="{ row }">
        <RelSelect v-model="row[col.prop]" :rel="col.relation!" />
      </template>
    </CRUD>
  
    <InfoDialog ref="infoRef" />
  
    <RelDialog ref="relRef" />
  
    <ContextMenu v-model="menu.vis" :menus="menus" :x="menu.x" :y="menu.y" />
  </div>
</template>

<style lang="scss">
.orm-table {
  display: flex;
  // height: 300px;

  &_left {
    flex-shrink: 0;
    max-width: 280px;
    height: unset !important;
    margin-right: 16px;
  }

  &_table {
    flex: 1;
    width: 0;
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