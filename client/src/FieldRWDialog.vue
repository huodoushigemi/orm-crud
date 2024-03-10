<template>
  <el-dialog v-bind="$attrs" append-to-body title="读写权限">
    <FieldRW :permis="$data" />

    <template #footer>
      <el-button>取消</el-button>
      <el-button type="primary" @click="ok">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { IRWPermis } from './RWPermis'
import FieldRW from './FieldRW.vue'
import { watchEffect } from 'vue';

const props = defineProps<{
  data: IRWPermis
}>()

const emit = defineEmits(['update:data', 'update:vis', 'ok'])

const $data = useVModel(props, 'data', undefined, { passive: true, clone: permis => permis.clone() })

watchEffect(() => console.log($data.value.data))

function ok() {
  emit('update:data', $data.value.clone())
  emit('update:vis', false)
  emit('ok', $data.value)
}
</script>