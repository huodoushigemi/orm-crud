<template>
  <el-dialog title="关系图" class="orm-dialog" v-bind="$attrs" draggable align-center style="height: 600px">
    <RelGraph :table="table" style="height: 100%;" />
  </el-dialog>
</template>

<script setup lang="ts">
import RelGraph from './RelGraph.vue'

const props = defineProps<{
  table?: string
}>()
</script>