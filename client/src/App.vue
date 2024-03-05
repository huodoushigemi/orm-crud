<script setup lang="ts">
import Table from './Table.vue'
import ConfigProvider from './ConfigProvider.vue'
import { TableOpt } from './props';
import tables from './tables/index'
import RelGraph from './RelGraph.vue';
import RelGraphDialog from './RelGraphDialog.vue';

import { useDialogBind } from './hooks'

const relgraphBind = useDialogBind()
</script>

<template>
  <ConfigProvider :tables="tables">
    <Table table="User" />

    <br />

    <!-- <Table table="Post" /> -->
    <Table table="Video" />

    <RelGraphDialog v-if="relgraphBind.vis" v-bind="relgraphBind" table="User" />

    <el-button @click="relgraphBind.vis = true">open</el-button>
  </ConfigProvider>
</template>
