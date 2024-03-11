<script setup lang="ts">
import Table from './Table.vue'
import ConfigProvider from './ConfigProvider.vue'
import tables from './tables/index'
import RelGraph from './RelGraph.vue';
import RelGraphDialog from './RelGraphDialog.vue'
import FieldRWV from './FieldRW.vue';

import { useDialogBind } from './hooks'
import { computed, ref } from 'vue';
import FieldRWDialog from './FieldRWDialog.vue';
import { RWPermis } from './RWPermis';
import { extend } from 'umi-request';
import { IApiAdapter } from '@orm-crud/core';

const relgraphBind = useDialogBind()
const fieldRwBind = useDialogBind()

const rwMap = ref({ 'User': 6, 'User.name': 4, 'User.age': 6 })
const rwPermis = computed(() => RWPermis(rwMap.value))

const request = extend({
  prefix: 'http://localhost:3000/prisma'
})

const api: IApiAdapter = {
  find: (ctx, data) => request.post(`/find/${ctx.table}`, { data }),
  finds: (ctx, data) => request.post(`/finds/${ctx.table}`, { data }),
  page: (ctx, data) => request.post(`/page/${ctx.table}`, { data }),
  count: (ctx, data) => request.post(`/count/${ctx.table}`, { data }),
  create: (ctx, data) => request.post(`/create/${ctx.table}`, { data }),
  update: (ctx, data) => request.post(`/update/${ctx.table}`, { data }),
  remove: (ctx, data) => request.post(`/remove/${ctx.table}`, { data }),
  removes: (ctx, data) => request.post(`/removes/${ctx.table}`, { data }),
}

const log = (...arg) => console.log(...arg)
</script>

<template>
  {{ rwMap }}
  <ConfigProvider :tables="tables" :api="api">

    <Table table="gfdc_auth_user" />

    <br />

    <!-- <Table table="Post" /> -->
    <!-- <Table table="Video" /> -->

    <RelGraphDialog v-if="relgraphBind.showing" v-bind="relgraphBind" table="User" />
    <FieldRWDialog v-if="fieldRwBind.showing" v-bind="fieldRwBind" @ok="log" />

    <el-button @click="fieldRwBind.data = rwPermis">open</el-button>
  </ConfigProvider>
</template>
