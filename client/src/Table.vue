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
import { TableXXX } from './props'
import { useConfig } from './context'
import { getP, normalizeField } from './utils'

import IEdite from '~icons/ep/edit'
import IDelete from '~icons/ep/delete'
import IDocument from '~icons/ep/document'

defineOptions({  })

const props = defineProps<Partial<TableXXX> & {
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
// const ctx = toReactive(computed(() => config.cruds[props.table]))
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
  { title: '详情', icon: IDocument, onClick: () => infoRef.value.open(menu.row) },
  { title: '编辑', icon: IEdite, onClick: () => infoRef.value.open(menu.row) },
  { title: '删除', icon: IDelete, disabled: true, divided: true, onClick: () => infoRef.value.open(menu.row) },
  { title: '关联的表', children: ctx().rels.map(e => ({ title: e.label, onClick: () => relRef.value.open(menu.row, e, ctx()) })) }
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
const c = ref(0)
const c2 = ref(15)
</script>

<template>
  <div class="orm-table">
    <RelOptions class="orm-table_left" v-model="searchModel[ctx().rels[c].prop]" :rel="ctx().rels[c].relation" :header="ctx().rels[c].label" :pageSize="c2" defaultFirst @update:modelValue="crudRef.getData()" />

    <el-button @click="c2++">{{ c2 }}</el-button>
    
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
        onRowContextmenu: openMenu
      }"
    >
      <template v-for="col in ctx().columns.filter(e => e.relation)" #[`$${col.prop}`]="{ row }">
        <div>
          <RelTag :data="getP(row, col.prop)" :field="col" />
        </div>
      </template>
  
      <template v-for="col in _searchs.filter(e => e.relation)" #[`search:${col.prop}`]="{ row }">
        <RelSelect v-model="row[col.prop]" :rel="col.relation!" />
      </template>
  
      <template v-for="col in ctx().forms.filter(e => e.relation)" #[`form:${col.prop}`]="{ row }">
        <RelSelect v-model="row[col.prop]" :rel="col.relation!" />
      </template>
    </CRUD>
  
    <InfoDialog ref="infoRef" :ctx="ctx()" />
  
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
</style>