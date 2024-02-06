<script setup lang="ts">
import { computed, provide, toRefs } from 'vue'
import { ConfigProviderProps, TableXXX } from './props'
import { configContextKey } from './context'
import { toReactive } from '@vueuse/core'
import { createCruds } from './crud'

const props = defineProps<ConfigProviderProps>()

provide(configContextKey, toReactive({
  ...toRefs(props),
  cruds: computed(() => createCruds(props.tables))
}))
</script>

<template>
  <slot />
</template>