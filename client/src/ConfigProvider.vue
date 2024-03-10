<script setup lang="ts">
import { computed, provide, ref, toRef, toRefs } from 'vue'
import { toReactive } from '@vueuse/core'
import { createCtxs } from '@orm-crud/core'
import { fieldFilter } from '@orm-crud/core/utils'
import { ConfigProviderProps } from './props'
import { configContextKey } from './context'

const props = defineProps<ConfigProviderProps>()

provide(configContextKey, toReactive({
  ...toRefs(props),
  ctxs: computed(() => createCtxs(props.tables, {
    // fieldFilter: props.rwPermis ? (ctx, prop) => fieldFilter(ctx, prop, props.rwPermis!.r) : undefined,
    api: props.api,
  })),
}))
</script>

<template>
  <slot />
</template>