<script setup lang="ts">
import Table from './Table.vue'
import ConfigProvider from './ConfigProvider.vue'
import { TableXXX } from './props';
import tables from './tables/index'
</script>

<template>
  <ConfigProvider :tables="tables">
    <Table table="comment" />
  </ConfigProvider>
</template>
