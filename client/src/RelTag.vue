<template>
  <el-tag v-for="item in toArr(data)" style="cursor: pointer; margin-right: 4px;" @click="$refs.info.open(item, config.cruds[rel.table])">
    {{ item[rel.label] }}
  </el-tag>

  <InfoDialog ref="info" />
</template>

<script setup lang="tsx">
import { Relation } from './props'
import { useConfig } from './context'
import InfoDialog from './InfoDialog.vue'

const props = defineProps<{
  rel: Required<Relation>
  data?: Record<string, any>
}>()

const config = useConfig()

const toArr = val => Array.isArray(val) ? val : (val == null ? [] : [val])
</script>
