<template>
  <el-tree :data="datas" :props="{ label: 'label', children: 'children' }" node-key="key">
    <template #default="{ node, data }">
      <div @click.stop>
        <el-checkbox :model-value="permis.r(data.key)" @update:model-value="toggle(data, permis.r)" :indeterminate="indeterminate(data, permis.r)" label="R" size="large" style="margin-left: 0px; margin-right: 0; padding: 0 18px 0 0;" @click.stop />
        <el-checkbox :model-value="permis.w(data.key)" @update:model-value="toggle(data, permis.w)" :indeterminate="indeterminate(data, permis.w)" label="W" size="large" style="margin-left: 0px; margin-right: 12px; padding: 0 16px 0 0;" @click.stop />
      </div>
      {{ data.label }}
    </template>
  </el-tree>
</template>

<script setup lang="ts">
import { useConfig } from './context'
import { $ } from './hooks'
import { IRWPermis } from './RWPermis'

const props = defineProps<{
  permis: IRWPermis
}>()

const emit = defineEmits(['change'])

const config = useConfig()

const datas = $(() => Object.values(config.ctxs).map(ctx => ({
  label: ctx.label || ctx.table,
  key: ctx.table,
  children: ctx.fields.filter(e => !e.relation && ctx.map.id != e.prop).map(f => ({
    label: f.label,
    key: `${ctx.table}.${f.prop}`
  }))
})))

function toggle(node, oper: (flag: string, plus?: boolean) => boolean) {
  const { key } = node
  if (node.children) {
    const checkedAll = node.children.every(e => oper(e.key))
    if (!oper(key) || !checkedAll) {
      oper(key, true)
      node.children.forEach(e => oper(e.key, true))
      emit('change', props.permis)
    } else {
      oper(key, false)
      node.children.forEach(e => oper(e.key, false))
      emit('change', props.permis)
    }
  }
  else if (key.includes('.')) {
    oper(key) ? oper(key, false) : oper(key, true)

    const table = key.split('.')[0]
    const parentData = datas().find(e => e.key == table)!
    if (parentData.children.some(e => oper(e.key))) {
      oper(table, true)
      emit('change', props.permis)
    } else {
      oper(table, false)
      emit('change', props.permis)
    }
  }
}

function indeterminate(node, oper: (flag: string, plus?: boolean) => boolean) {
  if (!node.children) return false
  if (!oper(node.key)) return false
  return node.children.some(e => !oper(e.key))
}
</script>