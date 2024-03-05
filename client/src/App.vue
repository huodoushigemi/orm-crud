<script setup lang="ts">
import Table from './Table.vue'
import ConfigProvider from './ConfigProvider.vue'
import { TableOpt } from './props';
import tables from './tables/index'
import RelGraph from './RelGraph.vue';
</script>

<template>
  <ConfigProvider :tables="tables">
    <Table table="User" />

    <br />

    <!-- <Table table="Post" /> -->
    <Table table="Video" />

    <RelGraph />
  </ConfigProvider>
</template>
