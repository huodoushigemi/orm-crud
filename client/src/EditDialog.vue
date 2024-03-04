<template>
  <el-dialog v-if="data" v-bind="$attrs" append-to-body class="orm-edit-dialog">
    <template #header>
      <span class="el-dialog__title">{{ isNew() ? '创建' : '编辑' }}</span>
      <el-button type="info" text bg size="small" style="margin-left: 12px;" @click="() => $refs.xxx.open(ctx().table)">
        <i-ep:setting />
      </el-button>
      {{ $data }}
      <!-- {{ nFields }} -->
    </template>

    <ElFormRender v-if="$data" ref="formRef" :model="$data" label-Width="100px">
      <template v-for="col in nFields">
        <ElFormItemRender v-if="col.relation" v-bind="col" :el="{ is: col.editor }">
          <!-- <RelSelect :modelValue="get($data, col.prop)" @update:modelValue="set($data, col.prop, $event)" :rel="col.relation!" :multiple="isRelMany(col.relation!.rel)" /> -->
          <RelSelect2 :model="$data" :raw="req.data.value" :table="table" :field="col" />
        </ElFormItemRender>
        <ElFormItemRender v-else v-bind="col" :el="{ is: col.editor }" />
      </template>
    </ElFormRender>

    <template #footer>
      <el-button>取消</el-button>
      <el-button type="primary" :disabled="okLoading" :loading="okLoading" @click="ok">确认</el-button>
    </template>

    <RelFieldsDialog ref="xxx" v-model="fields" :defaults="defaults" :filter="fieldFilter" />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import { isObject } from '@vue/shared'
import { ElMessage } from 'element-plus'
import { ElFormRender, ElFormItemRender } from 'el-form-render'
import { useRequest } from 'vue-request'
import { get, isArray, isEqual, keyBy, pick, set } from 'lodash-es'
import RelSelect from './RelSelect.vue'
import { useConfig } from './context'
import { useStorage } from './hooks'
import RelFieldsDialog from './RelFieldsDialog.vue'
import { isRelMany, normalizeField, inMany, diff } from './utils'
import { TableCtx } from './crud'
import RelSelect2 from './RelSelect2.vue'
import { NormalizedField } from './props'

const props = defineProps<{
  table: string
  data: any
}>()

const emit = defineEmits(['update:vis', 'finish'])

const config = useConfig()
const ctx = () => config.cruds[props.table]
const idKey = () => ctx().map.id
const isNew = () => props.data?.[idKey()] == null

const defaults = () => ctx().forms.map(e => e.prop)

const fields = useStorage(
  () => `orm-edit-fields_${ctx().table}`,
  { default: defaults }
)

function fieldFilter(ctx, field: NormalizedField, queue: NormalizedField[]) {
  const fs = queue.filter(e => isRelMany(e.relation?.rel))
  return fs.length == 0 || (fs.length == 1 && field.relation)
}

const nFields = computed(() => fields.value.map(e => normalizeField(ctx(), e)))

const $data = ref()
const req = useRequest(({ data, fields }) => ctx().find(data, fields), { manual: true })

watch(
  () => ({ data: pick(props.data, idKey()), fields: fields.value }),
  v => v.data?.[idKey()] == null || req.run(v),
  { immediate: true }
)

watchEffect(() => $data.value = props.data ? {} : undefined)
watchEffect(() => $data.value = JSON.parse(JSON.stringify(req.data.value || {})))

// watchEffect(() => console.log(nFields.value))

const formRef = ref()
const okLoading = ref(false)

async function ok() {
  await formRef.value.validate()
  // okLoading.value = true
  const model = $data.value
  const rData = req.data.value

  return console.log(diff(ctx(), model, rData || {}), model);
  // 只更新修改的字段
  const data = diff(ctx(), model, rData || {})

  try {
    if (isNew()) {
      await ctx().create(data)
    } else {
      const data = {}
      await ctx().update({ [idKey()]: model[idKey()], ...data })
    }
    ElMessage({ message: '操作成功', type: 'success' })
    emit('update:vis', false)
    emit('finish')
  } finally {
    okLoading.value = false
  }
}
</script>

<style lang="scss">
.orm-edit-dialog {
  .el-dialog__header {
    display: flex;
    align-items: center;
  }

  .el-select {
    width: 100% !important;
  }
}
</style>