<script setup lang="ts">
import { computed, provide, ref, toRef, toRefs } from 'vue'
import { toReactive } from '@vueuse/core'
import { ConfigProviderProps, TableOpt } from './props'
import { configContextKey } from './context'
import { TableCtx, createCtxs } from './crud'
import { fieldFilter } from './utils'
import { $ } from './hooks'
import { RWPermis } from './RWPermis'

const props = defineProps<ConfigProviderProps>()

const rwPermis = $(() => RWPermis(props.rwMap))

provide(configContextKey, toReactive({
  tables: toRef(props, 'tables'),
  ctxs: $(() => createCtxs(props.tables, (ctx, prop) => fieldFilter(ctx, prop, rwPermis().r))),
  rwPermis,
}))
</script>

<template>
  <slot />
</template>