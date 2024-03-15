<template>
  <el-dialog v-bind="$attrs" append-to-body class="orm-edit-dialog orm-dialog" draggable>
    <template #header>
      <span class="el-dialog__title">{{ isNew() ? '创建' : '编辑' }}</span>
      <el-button type="info" text bg size="small" style="margin-left: 12px;" @click="fieldsBind.vis = true">
        <i-ep:setting />
      </el-button>
    </template>

    <EditForm ref="formRef" :table="table" :model="model" :fields="select" />

    <template #footer>
      <el-button>取消</el-button>
      <el-button type="primary" :disabled="okLoading" :loading="okLoading" @click="ok">确认</el-button>
    </template>

    <FieldsDialog v-if="fieldsBind.showing" v-bind="fieldsBind" :table="table" v-model:data="select" :defaults="defaults" :filter="relFieldFilter" :process-opt="processOpt" />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRequest } from 'vue-request'
import { pick } from 'lodash-es'
import { NormalizedField, TableCtx } from '@orm-crud/core'
import { isRelMany, diff } from '@orm-crud/core/utils'
import { useConfig } from './context'
import { useDialogBind, useStorage } from './hooks'
import FieldsDialog from './FieldsDialog.vue'
import EditForm from './EditForm.vue'

const props = defineProps<{
  table: string
  data: any
}>()

const emit = defineEmits(['update:vis', 'finish'])

const config = useConfig()
const ctx = () => config.ctxs[props.table]
const pk = () => ctx().map.id
const isNew = () => props.data?.[pk()] == null

const fieldsBind = useDialogBind()

const defaults = () => ctx().forms.map(e => e.prop)

const select = useStorage(
  () => `orm-edit-fields_${ctx().table}`,
  { default: defaults }
)

function relFieldFilter(ctx, field: NormalizedField, queue: NormalizedField[]) {
  const fs = queue.filter(e => isRelMany(e.relation?.rel))
  return fs.length == 0 || (fs.length == 1 && !!field.relation)
}

function processOpt(ctx: TableCtx, field: NormalizedField, queue: NormalizedField[]) {
  const rel = field.relation
  return rel && ctx.ctxs[rel.table!].middle ? { disabled: true } : undefined
}

const model = ref({})
const req = useRequest((opt) => ctx().api.find(opt), { manual: true })
watch(
  () => ({ where: pick(props.data, pk()), select: select.value }),
  async opt => {
    if (opt.where[pk()] == null) {
      model.value = props.data || {}
    } else {
      await req.runAsync(opt)
      model.value = JSON.parse(JSON.stringify(req.data.value))
    }
  },
  { immediate: true }
)

const formRef = ref()
const okLoading = ref(false)

async function ok() {
  await formRef.value.validate()
  okLoading.value = true
  const fd = model.value
  const rData = req.data.value

  // 只更新修改的字段
  const data = diff(ctx(), fd, rData || {})

  try {
    if (isNew()) {
      await ctx().api.create(data)
    } else {
      await ctx().api.update({ [pk()]: fd[pk()], ...data })
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