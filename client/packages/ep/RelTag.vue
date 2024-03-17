<template>
  <el-tag v-for="item in toArr(data)" style="cursor: pointer; margin-right: 4px;" @click="infoBind.data = item">
    {{ item[rel.label] }}
  </el-tag>

  <InfoDialog v-if="infoBind.showing" v-bind="infoBind" :table="rel.table" />
</template>

<script setup lang="ts">
import { Relation } from '@orm-crud/core'
import { useConfig } from './context'
import InfoDialog from './InfoDialog.vue'
import { useDialogBind } from './hooks'

const props = defineProps<{
  rel: Required<Relation>
  data?: Record<string, any>
}>()

const config = useConfig()
const infoBind = useDialogBind()

const toArr = val => Array.isArray(val) ? val : (val == null ? [] : [val])
</script>
