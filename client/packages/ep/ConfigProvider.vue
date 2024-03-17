<script setup lang="ts">
import { computed, provide, ref, toRef, toRefs } from 'vue'
import { toReactive } from '@vueuse/core'
import { createCtxs } from '@orm-crud/core'
import { fieldFilter } from '@orm-crud/core/utils'
import { ConfigProviderContext, ConfigProviderProps } from './props'
import { configContextKey } from './context'
import { $ } from './hooks'

const props = defineProps<ConfigProviderProps>()

const clone = (obj) => JSON.parse(JSON.stringify(obj))
const tables = $(() => clone(props.tables))

const config: ConfigProviderContext = toReactive({
  ...toRefs(props),
  tables,
  ctxs: computed(() => createCtxs(tables.value, {
    fieldFilter: props.rwPermis ? (ctx, prop) => fieldFilter(ctx, prop, props.rwPermis!.r) : undefined,
    api: props.api,
  })),
})

provide(configContextKey, config)
</script>

<template>
  <slot v-bind="config" />
</template>