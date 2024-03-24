<template>
  <ElFormRender ref="formRef" :model="model" label-Width="100px">
    <template v-for="col in nFields">
      <ElFormItemRender v-if="col.relation" v-bind="col" :el="{ ...col.el, disabled: isDisabled(col) }">
        <RelSelect2 :model="model" :raw="raw" :table="table" :field="col" />
      </ElFormItemRender>
      <ElFormItemRender v-else v-bind="col" :el="{ ...col.el, disabled: isDisabled(col) }" />
    </template>
  </ElFormRender>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { isString } from '@vue/shared'
import { toReactive } from '@vueuse/core'
import { ElFormRender, ElFormItemRender } from 'el-form-render'
import { NormalizedField } from '@orm-crud/core'
import { normalizeField, fieldFilter, nForms, fieldsFilter } from '@orm-crud/core/utils'
import { useConfig } from './context'
import RelSelect2 from './RelSelect2.vue'

const props = withDefaults(defineProps<{
  table: string
  model: any
  fields?: string[]
}>(), {
  model: () => ({})
})

const config = useConfig()
const ctx = () => config.ctxs[props.table]
const rwPermis = () => config.rwPermis

const isDisabled = (field: NormalizedField) => (
  (rwPermis() && !fieldFilter(ctx(), field.prop, rwPermis()!.w)) ||
  (field.editable !== undefined && !field.editable && props.model[ctx().map.id] != null) ||
  (field.editor?.disabled)
)

const raw = ref()
watch(() => props.model, v => raw.value = JSON.parse(JSON.stringify(v)))

const fields = () => props.fields || ctx().forms?.map(e => isString(e) ? e : e.prop)

const nFields = computed(() => {
  let arr = fields()
  if (rwPermis()) arr = fieldsFilter(ctx(), arr, rwPermis()!.r)
  return nForms(ctx(), arr)
})

const formRef = ref({})
defineExpose(toReactive(formRef))
</script>