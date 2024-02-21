<template>
  <ElDescriptions border :column="column">
    <!-- <ElDescriptionsItem v-for="(col, i) in cols" :label="col.label" :span="i == cols.length - 1 ? column - (i % column) : 1">
      <RelTag v-if="col.relation" :data="getP($data, col.prop)" :rel="col.relation" />
      <template v-else>{{ getP($data, col.prop) }}</template>
    </ElDescriptionsItem>

    <ElDescriptionsItem v-for="col in cols_html" :label="col.label" :span="column">
      <div v-html="getP($data, col.prop)"></div>
    </ElDescriptionsItem> -->

    <!-- <ElDescriptionsItem v-for="col in nFields" :label="col.label">
      <RelTag v-if="col.relation" :data="getP($data, col.prop)" :rel="col.relation" />
      <template v-else>{{ getP($data, col.prop) }}</template>
    </ElDescriptionsItem> -->

    <ElDescriptionsItem v-for="col in nFields.filter(e => !e.relation && !e.prop.includes('.'))" :label="col.label">
      <RelTag v-if="col.relation" :data="getP($data, col.prop)" :rel="col.relation" />
      <template v-else>{{ getP($data, col.prop) }}</template>
    </ElDescriptionsItem>
  </ElDescriptions>

  <div v-for="col in nFields.filter(e => e.relation)">
    <div>{{ col.label }}</div>
    <Table :table="col.relation!.table" :extraQuery="set({}, pathReverse(ctx, col.prop), pick(data, ctx.map.id))" :hasOperation="false" />
  </div>
</template>

<script setup lang="tsx">
import { computed, withDefaults, watchEffect, watch, defineComponent, PropType } from 'vue'
import { toReactive, useBreakpoints, breakpointsTailwind } from '@vueuse/core'
import { useRequest } from 'vue-request'
import { ElDescriptions, ElDescriptionsItem } from 'element-plus'
import { set, pick } from 'lodash-es'
import { findFieldPath, getP, normalizeField, pathReverse } from './utils'
import RelTag from './RelTag.vue'
import Table from './Table.vue'
import { useConfig } from './context'
import { TableCtx } from './crud'
import { NormalizedField } from './props'

const props = withDefaults(defineProps<{
  ctx: TableCtx
  data: Record<string, any>
  fields: string[]
}>(), {
  data: () => ({})
})

const breakpoints = useBreakpoints(breakpointsTailwind)
const column = computed(() => breakpoints.smallerOrEqual('sm').value ? 2 : 3)

const nFields = computed(() => props.fields?.map(e => normalizeField(e, props.ctx)))
const cols = computed(() =>  props.ctx.columns.filter(e => !e.html))
const cols_html = computed(() => props.ctx.columns.filter(e => e.html))

const $data = computed(() => req.data.value || {})
const req = useRequest(({ data, fields }) => props.ctx.find(data, fields), { manual: true })

watch(() => {
  const { data, ctx, fields } = props
  if (!data) return
  const prop = ctx.map.id
  return { data: { [prop]: data[prop] }, fields }
}, v => {
  v && req.run(v)
}, {
  immediate: true
})

type A = {
  prop: string
  // parent: string
  children?: A[]
}
// const aaa = computed(() => {
//   const ret = {} as Record<string, A>
//   let __ = ''
//   const insert = (s: string) => (ret[s] = ret[__ = s.includes('.') ? s.replace(/\.[^\.]+$/, '') : ''] ||= { prop: __, children: [] }).children!.push({ prop: s,  children: [] })
//   return props.fields.forEach(prop => insert(prop))
// })

// const xxx = defineComponent({
//   props: {
//     fields: Array as PropType<string[]>,
//     data: null
//   },
//   setup(props, ctx) {
//     return () => {
//       const rels = []
//       return (
//         <ElDescriptions border :column={column}>
//           { props.fields!.map(e => {

//             const ps = findFieldPath(props.ctx, e)
//             ps[ps.length - 1]
//           })}
//         </ElDescriptions>
//       )
//     }
//   },
// })
</script>
