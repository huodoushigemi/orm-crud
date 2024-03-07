<script setup lang="ts">
import { computed, provide, ref, toRef, toRefs } from 'vue'
import { toReactive } from '@vueuse/core'
import { createCtxs } from '@orm-crud/core'
import { fieldFilter } from '@orm-crud/core/utils'
import { ConfigProviderProps } from './props'
import { configContextKey } from './context'
import { RWPermis } from './RWPermis'

const props = defineProps<ConfigProviderProps>()

const rwPermis = computed(() => RWPermis(props.rwMap))

provide(configContextKey, toReactive({
  tables: toRef(props, 'tables'),
  ctxs: computed(() => createCtxs(props.tables, (ctx, prop) => fieldFilter(ctx, prop, rwPermis.value.r))),
  rwPermis,
}))
</script>

<template>
  <slot />
</template>