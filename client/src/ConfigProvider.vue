<script setup lang="ts">
import { provide } from 'vue'
import { ConfigProviderProps, TableXXX } from './props'
import { configContextKey } from './context'

const props = defineProps<ConfigProviderProps>()

provide(configContextKey, props)
</script>

<template>
  <slot />
</template>