<script setup lang="ts">
import { reactive, computed, ref, watchEffect } from 'vue'
import { toReactive } from '@vueuse/core'
import CRUD from '@el-lowcode/crud'
import { ElFormItemRender } from 'el-form-render/index'
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
import { linkEmits } from 'element-plus'
import EditDialog from './EditDialog.vue'
import { useDialogBind } from './hooks'
import RelSelect2 from './RelSelect2.vue'

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
  ...props.searchs?.map(e => normalizeField(ctx(), e)).filter(e => ctx().searchs.every(ee => ee.prop != e.prop)) || [],
  ...ctx().searchs
])
const _columns = computed(() => props.columns || ctx().columns)
// row => getP(row, e.prop)

const searchModel = ref({})

async function request(_, data, type) {
  if (type == 'list') {
    return ctx().page(data, props.columns?.map(e => normalizeField(ctx(), e)).map(e => e.prop))
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
const edit = useDialogBind()
const relBind = useDialogBind()

const menu = reactive({ vis: false, row: null, x: 0, y: 0 })
const menus = computed(() => [
  { title: '详情', icon: IDocument, onClick: () => infoRef.value.open(menu.row, ctx()) },
  { title: '编辑', icon: IEdite, onClick: () => edit.data = menu.row },
  { title: '删除', icon: IDelete, disabled: true, divided: true, onClick: () => infoRef.value.open(menu.row, ctx()) },
  { title: '关联的表', children: ctx().rels.map(e => ({ title: e.label, onClick: () => Object.assign(relBind, { data: menu.row, table: ctx().table, prop: e.prop }) })) }
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
      <template v-for="col in ctx().columns.filter(e => e.relation)" #[`$${col.prop}`]="{ row }">
        <div>
          <RelTag :data="getP(row, col.prop)" :rel="col.relation!" />
        </div>
      </template>
  
      <template v-for="col in _searchs.filter(e => e.relation)" #[`search:${col.prop}`]="{ row }">
        <!-- <RelSelect v-model="row[col.prop]" :rel="col.relation!" /> -->
        <RelSelect2 :table="table" :model="row" :raw="{}" :field="col" />
      </template>
  
      <!-- <template v-for="col in ctx().forms.filter(e => e.relation)" #[`form:${col.prop}`]="{ row }">
        <RelSelect v-model="row[col.prop]" :rel="col.relation!" />
      </template> -->

      <template #header>
        <el-button type="primary" @click="edit.data = {}">新增</el-button>
      </template>
    </CRUD>
  
    <InfoDialog ref="infoRef" />

    <EditDialog v-bind="edit" :table="table" @finish="crudRef.getData()" />
  
    <RelDialog ref="relRef" v-bind="relBind" />
  
    <ContextMenu v-model="menu.vis" :menus="menus" :x="menu.x" :y="menu.y" />
  </div>
</template>

<style lang="scss">
.orm-table {
  display: flex;

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