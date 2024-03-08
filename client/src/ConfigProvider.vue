<script setup lang="ts">
import { computed, provide, ref, toRef, toRefs } from 'vue'
import { toReactive } from '@vueuse/core'
import { IApiAdapter, createCtxs } from '@orm-crud/core'
import { fieldFilter } from '@orm-crud/core/utils'
import { ConfigProviderProps } from './props'
import { configContextKey } from './context'
import { RWPermis } from './RWPermis'
import { extend } from 'umi-request'

const props = defineProps<ConfigProviderProps>()

const rwPermis = computed(() => RWPermis(props.rwMap))

const request = extend({
  prefix: 'http://localhost:3000/prisma'
})

const api: IApiAdapter = {
  find: (ctx, data, fields) => request.post(`/find/${ctx.table}`, { data: { where: data, fields } }),
  finds: (ctx, data, fields) => request.get(`/finds/${ctx.table}`, { data: { where: data, fields } }),
  page: (ctx, data, fields) => request.post(`/page/${ctx.table}`, { data: { where: data, fields } }),
  create: (ctx, data) => request.post(`/create/${ctx.table}`, { data }),
  update: (ctx, data) => request.post(`/update/${ctx.table}`, { data }),
  remove: (ctx, data) => request.post(`/remove/${ctx.table}`, { data }),
  removes: (ctx, data) => request.post(`/removes/${ctx.table}`, { data }),
  count: (ctx, data) => request.post(`/count/${ctx.table}`, { data }),
}

provide(configContextKey, toReactive({
  tables: toRef(props, 'tables'),
  ctxs: computed(() => createCtxs(props.tables, {
    fieldFilter: (ctx, prop) => fieldFilter(ctx, prop, rwPermis.value.r),
    api,
  })),
  rwPermis,
}))
</script>

<template>
  <slot />
</template>