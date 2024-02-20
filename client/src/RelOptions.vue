<template>
  <div class="orm-rel-options">
    <div v-if="header || $slots.header || searchable" class="orm-rel-options_header">
      <slot name="header">{{ header }}</slot>
      
      <el-input v-if="searchable" class="orm-rel-options_search" v-model="searchTemp" placeholder="输入关键字" clearable @keydown.enter="search = searchTemp; refresh()" />
    </div>

    <Options
      v-model="value"
      class="orm-rel-options_options"
      :options="options"
      :props="{ label: rel.label, value: rel.prop }"
      obj
      clearable
    >
      <el-empty v-if="!loading && data && !dataList.length" :image-size="128" />
      <el-icon v-if="!noMore" ref="loadingRef" class="is-loading" size="24" style="display: block; margin: 4px auto; opacity: .4;"><i-ep:loading /></el-icon>
    </Options>

    <div v-if="footer ||$slots.footer" class="orm-rel-options_footer">
      <slot name="footer">{{ footer }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, watchEffect } from 'vue'
import { Arrayable, toReactive, unrefElement, useCurrentElement, useInfiniteScroll, useVModel } from '@vueuse/core'
import { useLoadMore } from 'vue-request'
import { pick } from 'lodash-es'
import Options from './Options.vue'
import { RelField, Relation } from './props'
import { useConfig } from './context'

type Obj = Record<string, any>

const props = withDefaults(defineProps<{
  modelValue?: Arrayable<Obj>
  rel: Required<Relation>
  defaultFirst: boolean
  pageSize?: number
  header?: string
  footer?: string
  searchable?: boolean
}>(), {
  pageSize: 5,
  searchable: true
})

const emit = defineEmits(['update:modelValue'])
const config = useConfig()

const value = useVModel(props, 'modelValue')

const search = ref(''), searchTemp = ref('')

const { data, dataList, loadMoreAsync, refresh, loading, noMore } = useLoadMore(
  async (d: any) => {
    d ||= { page: 0 }
    const { table, label, prop } = props.rel, { pageSize } = props
    const { list, total } = await config.cruds[table].page({ [label]: search.value, $page: ++d.page, $pageSize: pageSize })
    if (props.defaultFirst && props.modelValue === undefined && d.page == 1 && list.length) value.value = pick(list[0], [prop, label])
    return { list, total, page: d.page }
  },
  { throttleInterval: 600, isNoMore: (e) => e?.list.length >= e?.total }
)

const options = computed(() => {
  const val = props.modelValue, { prop } = props.rel
  if (!val) return dataList.value
  if (search.value) return dataList.value
  const opt = dataList.value.find(e => e[prop] == val[prop])
  return opt ? dataList.value :  [val, ...dataList.value]
})

const el = useCurrentElement()
useInfiniteScroll(
  () => el.value?.querySelector('.el-scrollbar__wrap') as HTMLElement,
  () => loadMoreAsync() as any,
  { distance: 34, canLoadMore: () => !loading.value && !noMore.value }
)

const loadingRef = ref<HTMLElement>()
watch(() => data.value?.page, async () => {
  await nextTick()
  const loadingEl = unrefElement(loadingRef.value)
  if (!loadingEl) return
  // if (loading.value) return
  const r1 = el.value.querySelector('.el-scrollbar__wrap')!.getBoundingClientRect()
  const r2 = loadingEl.getBoundingClientRect()
  if (r1.top > r2.bottom || r1.bottom < r2.top || r1.left > r2.right || r1.right < r2.left) return
  loadMoreAsync()
})
</script>

<style lang="scss">
.orm-rel-options {
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-overlay);
  border-radius: 4px;

  &_header, &_footer {
    padding: 0 18px;
    font-size: var(--el-form-label-font-size);
    color: var(--el-text-color-regular);
    &::after, &::before {
      content: '';
      display: block;
    }
    &::before {
      margin-bottom: 12px;
    }
    &::after {
      margin-top: 12px;
    }
  }

  &_header {
    border-bottom: 1px solid var(--el-border-color-light);
  }
  
  &_footer {
    border-top: 1px solid var(--el-border-color-light);
  }

  &_search {
    display: block;
    margin: 12px -6px;
    width: auto;
    .el-input__wrapper {
      width: 100%;
      min-width: 100px;
      box-sizing: border-box;
    }
    .el-input__inner {
      width: 0;
    }
  }

  &_options {
    flex: 1;
  }
}
</style>