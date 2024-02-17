<template>
  <el-tag v-for="item in toArr(data)" style="cursor: pointer; margin-right: 4px;" @click="$refs.info.open(item)">
    {{ item[rel.label] }}
  </el-tag>

  <InfoDialog ref="info" :ctx="config.cruds[field.relation!.table]" />
</template>

<script setup lang="tsx">
import { computed, ref, watchEffect } from 'vue'
import { NormalizedField } from './props'
import { useConfig } from './context'
import InfoDialog from './InfoDialog.vue'

const props = defineProps<{
  field: NormalizedField
  data?: Record<string, any>
}>()

const config = useConfig()
const rel = computed(() => props.field.relation!)

const toArr = val => Array.isArray(val) ? val : (val == null ? [] : [val])
</script>
