<script setup lang="ts">
import Table from './Table.vue'
import ConfigProvider from './ConfigProvider.vue'
import tables from './tables/index'
import RelGraph from './RelGraph.vue';
import RelGraphDialog from './RelGraphDialog.vue'
import FieldRWV from './FieldRW.vue';

import { useDialogBind } from './hooks'
import { ref } from 'vue';

const relgraphBind = useDialogBind()

const rwMap = ref({ 'User': 6, 'User.name': 4, 'User.age': 6 })
</script>

<template>
  {{ rwMap }}
  <ConfigProvider :tables="tables" :rw-map="rwMap">
    
    <FieldRWV  />

    <Table table="User" />

    <br />

    <!-- <Table table="Post" /> -->
    <Table table="Video" />

    <RelGraphDialog v-if="relgraphBind.vis" v-bind="relgraphBind" table="User" />

    <el-button @click="relgraphBind.vis = true">open</el-button>
  </ConfigProvider>
</template>
