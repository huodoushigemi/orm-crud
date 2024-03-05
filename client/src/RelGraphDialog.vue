<template>
  <el-dialog title="关系图" v-bind="$attrs">
    <RelGraph :table="table" />
  </el-dialog>
</template>

<script setup lang="ts">
import RelGraph from './RelGraph.vue'

const props = defineProps<{
  table?: string
}>()
</script>