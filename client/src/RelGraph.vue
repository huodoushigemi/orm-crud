<template>
  <div style="height: 500px; line-height: 0;"></div>
</template>

<script setup lang="ts">
import { useCurrentElement, useResizeObserver } from '@vueuse/core'
import { onBeforeUnmount, onMounted, onUnmounted } from 'vue'
import { useConfig } from './context';

const props = defineProps<{
  table?: string
}>()

if (!window.__g6_pending) {
  let solve
  window.__g6_pending = new Promise(s => solve = s)
  const tag = Object.assign(document.createElement('script'), { src: 'https://gw.alipayobjects.com/os/lib/antv/g6/4.8.24/dist/g6.min.js' })
  tag.onload = solve
  document.body.append(tag)
}

const el = useCurrentElement<HTMLElement>()
const config = useConfig()

let graph

onMounted(async () => {
  await window.__g6_pending
  
  graph = new G6.Graph({
    container: el.value,
    width: el.value.offsetWidth,
    height: el.value.offsetHeight,
    layout: {
      type: 'force',
      preventOverlap: true,
      linkDistance: 100,
      edgeStrength: 1,
      nodeStrength: -100,
    },
    modes: {
      default: ['drag-canvas', 'zoom-canvas', 'activate-relations'],
    },
    defaultNode: {
      color: '#5B8FF9',
    },
    minZoom: .4,
    maxZoom: 2,
    // plugins: [
    //   new G6.Minimap({ size: [64, 64] })
    // ]
  })

  graph.data({
    nodes: Object.values(config.ctxs).filter(e => !e.middle).map(e => ({
      id: e.table,
      label: e.label,
      size: props.table == e.table ? 64 : 46,
    })),
    edges: (() => {
      const map = new Set()
      const ret = []

      Object.values(config.ctxs).forEach(ctx => {
        if (ctx.middle) return
        ctx.rels.forEach(relField => {
          const relCtx = config.ctxs[relField.relation.table]
          const table = relCtx.middle
            ? relCtx.rels.find(e => e.relation.table != ctx.table)?.relation?.table
            : relCtx.table

          const x1 = `${ctx.table},${table}`, x2 = `${table},${ctx.table}`
          if (map.has(x1) || map.has(x2)) return
          map.add(x1)
          map.add(x2)
          
          ret.push({ source: ctx.table, target: table })
        })
      })

      return ret
    })()
  })

  graph.on('node:dragstart', function (e) {
    graph.layout()
    refreshDragedNodePosition(e)
  })
  graph.on('node:drag', function (e) {
    refreshDragedNodePosition(e)
  })
  graph.on('node:dragend', function (e) {
    e.item.get('model').fx = null
    e.item.get('model').fy = null
  })
  graph.on('node:click', (e) => {
    graph.focusItem(e.item, true, { easing: 'easeCubic', duration: 500 })
  })

  
  function refreshDragedNodePosition(e) {
    const model = e.item.get('model')
    model.fx = e.x;
    model.fy = e.y;
  }

  graph.render()
})

onUnmounted(() => {
  graph.destroy()
})

useResizeObserver(el, e => {
  const rect = e[0].contentRect
  if (!graph) return
  graph.changeSize(rect.width, rect.height)
  graph.fitCenter(true)
  // graph.fitView()
})
</script>

<style scoped lang="scss">
:deep(.g6-minimap-container) {
  border: 1px solid #c0c0c0;
  line-height: 0;
}
</style>