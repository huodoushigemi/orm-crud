<script setup lang="ts">
import Table from './Table.vue'
import ConfigProvider from './ConfigProvider.vue'
import { TableOpt } from './props';
import tables from './tables/index'
</script>

<template>
  <ConfigProvider :tables="tables">
    <Table table="User" />

    <br />

    <!-- <Table table="Post" /> -->
    <Table table="Video" />
  </ConfigProvider>
</template>
