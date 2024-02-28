<template>
  <RelSelect

  />
</template>

<script setup lang="tsx">
import { reactive, ref, watchEffect } from 'vue'
import { isArray } from '@vue/shared'
import { Arrayable } from '@vueuse/core'
import { useRequest } from 'vue-request'
import { get, set } from 'lodash-es'
import Table from './Table.vue'
import { Relation } from './props'
import { useConfig } from './context'
import { toArr, pickLP, findFieldPath } from './utils'
import RelSelect from './RelSelect.vue'

type Obj = Record<string, any>

const props = defineProps<{
  modelValue?: Arrayable<Obj>
  multiple?: boolean
  rel: Required<Relation>
}>()

const emit = defineEmits(['update:modelValue'])
const selectRef = ref()

const config = useConfig()
const ctx = () => config.cruds[props.rel.table]

function normal(e) {
  if (e === '') e = null
  const { rel } = props
  return isArray(e) ? e.map(e => pickLP(e, rel)) : pickLP(e, rel)
}
</script>

<style lang="scss">
.orm-rel-select {
  .orm-rel-select_expand {
    padding: 0 4px;
    width: 1.4em;
    height: 100%;
  }

  .el-select__prefix {
    margin: -3px 0 -3px -4px;
    // padding: 0 4px;
    border-radius: var(--el-border-radius-base);
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    opacity: .4;
    cursor: pointer;

    &:hover {
      background-color: var(--el-fill-color-light);
      opacity: 1;
    }
  }

  .el-select__wrapper {
    padding-left: 5px;
    align-items: unset;
  }
}
</style>