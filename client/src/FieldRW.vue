<template>
  <el-tree :data="datas()" :props="{ label: 'label', children: 'children' }" node-key="key">
    <template #default="{ node, data }">
      <el-checkbox :model-value="permis.r(data.key)" @update:model-value="toggle(data, permis.r)" :indeterminate="indeterminate(r, data)" label="R" size="large" style="margin-left: 0px; margin-right: 12px; padding: 0 6px 0 0;" @click.stop />
      <el-checkbox :model-value="permis.w(data.key)" @update:model-value="toggle(data, permis.w)" :indeterminate="indeterminate(w, data)" label="W" size="large" style="margin-left: 0px; margin-right: 12px; padding: 0 16px 0 0;" @click.stop />
      {{ data.label }}
    </template>
  </el-tree>
</template>

<script setup lang="ts">
import { remove } from '@vue/shared'
import { useConfig } from './context'
import { $ } from './hooks'
import { IRWPermis } from './RWPermis'

const props = defineProps<{
  permis: IRWPermis
}>()

const config = useConfig()

const datas = $(() => Object.values(config.ctxs).map(ctx => ({
  label: ctx.label || ctx.table,
  key: ctx.table,
  children: ctx.fields.filter(e => !e.relation && ctx.map.id != e.prop).map(f => ({
    label: f.label,
    key: `${ctx.table}.${f.prop}`
  }))
})))

function toggle(data, setter: (flag: string, plus?: boolean) => void) {
  const { key } = data
  // const set = new Set(arr)

  if (data.children?.length) {
    const checkedAll = data.children.every(e => set.has(e.key))
    if (!set.has(key) || !checkedAll) {
      set.has(key) || arr.push(key)
      data.children.forEach(e => set.has(e.key) || arr.push(e.key))
    } else {
      remove(arr, key)
      data.children.forEach(e => remove(arr, e.key))
    }
  }
  else if (key.includes('.')) {
    set.has(key) ? remove(arr, key) : arr.push(key)
    set.has(key) ? set.delete(key) : set.add(key)

    const table = key.split('.')[0]
    const parentData = datas().find(e => e.key == table)!
    if (parentData.children.some(e => set.has(e.key))) {
      set.has(table) || arr.push(table)
    } else {
      remove(arr, table)
    }
  }
}

function indeterminate(arr = [], data) {
  if (!data.children) return false
  if (!arr.includes(data.key)) return false
  return data.children.some(e => !arr.includes(e.key))
}
</script>