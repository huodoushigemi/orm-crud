<template>
  <div></div>
</template>

<script setup lang="ts">
import { useCurrentElement } from '@vueuse/core'
import { onMounted } from 'vue'
import { useConfig } from './context';

if (!window.__g6_pending) {
  let solve
  window.__g6_pending = new Promise(s => solve = s)
  const tag = Object.assign(document.createElement('script'), { src: 'https://gw.alipayobjects.com/os/lib/antv/g6/4.8.24/dist/g6.min.js' })
  tag.onload = solve
  document.body.append(tag)
}

const el = useCurrentElement()
const config = useConfig()

let graph

onMounted(async () => {
  await window.__g6_pending
  graph = new window.G6.Graph({
    container: el.value,
    width: 800,
    height: 500,
  })

  graph.data({
    nodes: Object.values(config.tables).filter(e => !e.middle).map(e => ({
      id: e.label,
      label: e.label,
    })),
    edges: (() => {
      const map = new Set()
      const ret = []
      Object.values(config.cruds).forEach(ctx => {
        ctx.rels.forEach(relField => {
          const relCtx = config.cruds[relField.relation.table]
          let table = ''
          if (relCtx.middle) {
            table = relCtx.rels.find(e => e.relation.table != ctx.table)?.relation?.table
          }
          else {
            table = relCtx.table
          }
          let x1 = `${ctx.table},${table}`, x2 = `${table},${ctx.table}`
          if (map.has(x1) || map.has(x2)) return
          map.add(x1)
          map.add(x2)
          
        })
      })
    })()
  })

  graph.render()
})
</script>
