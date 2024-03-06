<script setup lang="ts">
import Table from './Table.vue'
import ConfigProvider from './ConfigProvider.vue'
import { TableOpt } from './props';
import tables from './tables/index'
import RelGraph from './RelGraph.vue';
import RelGraphDialog from './RelGraphDialog.vue'
import FieldRWV from './FieldRW.vue';

import { useDialogBind } from './hooks'
import { ref } from 'vue';

const relgraphBind = useDialogBind()
const r = ref([]), w = ref([])
</script>

<template>
  <ConfigProvider :tables="tables">
    
    <FieldRWV :r="r" :w="w" />
        
    <Table table="User" />

    <br />

    <!-- <Table table="Post" /> -->
    <Table table="Video" />

    <RelGraphDialog v-if="relgraphBind.vis" v-bind="relgraphBind" table="User" />

    <el-button @click="relgraphBind.vis = true">open</el-button>
  </ConfigProvider>
</template>
