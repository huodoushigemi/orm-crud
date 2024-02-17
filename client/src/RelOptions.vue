<template>
  <div class="orm-rel-options">
    <div v-if="header || $slots.header" class="orm-rel-options_header">
      <slot name="header">{{ header }}</slot>
    </div>

    <Options
      v-model="value"
      class="orm-rel-options_options"
      :options="options"
      :replace="{ label: rel.label, value: rel.prop }"
      obj
      clearable
    >
      <el-empty v-if="!loading && data && !dataList.length" :image-size="128" />
      <el-icon v-if="hasMore()" ref="loadingRef" class="is-loading" size="24" style="display: block; margin: 4px auto; opacity: .4;"><i-ep:loading /></el-icon>
    </Options>

    <div v-if="footer ||$slots.footer" class="orm-rel-options_footer">
      <slot name="footer">{{ footer }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import { Arrayable, toReactive, unrefElement, useCurrentElement, useInfiniteScroll, useVModel } from '@vueuse/core'
import { useLoadMore } from 'vue-request'
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
}>(), {
  pageSize: 15
})

const emit = defineEmits(['update:modelValue'])
const config = useConfig()

const value = useVModel(props, 'modelValue')

const hasMore = () => !data.value || dataList.value.length < (data.value?.total || 0)

const { data, dataList, loadMoreAsync, refresh, loading } = useLoadMore(
  async (d: any) => {
    d ||= { page: 0 }
    const { table, label, prop } = props.rel, { pageSize } = props
    const { list, total } = await config.cruds[table].page({ [label]: '', $page: ++d.page, $pageSize: pageSize })
    if (props.defaultFirst && props.modelValue === undefined && d.page == 1 && list.length) value.value = ({ [prop]: list[0][prop], [label]: list[0][label] })
    return { list, total, page: d.page }
  },
  { debounceInterval: 600, manual: true, isNoMore: () => !hasMore() }
)

const options = computed(() => {
  const val = props.modelValue, { prop } = props.rel
  if (!val) return dataList.value
  const opt = dataList.value.find(e => e[prop] == val[prop])
  return opt ? dataList.value :  [val, ...dataList.value]
})

const el = useCurrentElement()
useInfiniteScroll(
  () => el.value?.querySelector('.el-scrollbar__wrap') as HTMLElement,
  () => loadMoreAsync() as any,
  { distance: 34, canLoadMore: hasMore }
)

const loadingRef = ref<HTMLElement>()
watch(() => data.value?.page, async () => {
  await nextTick()
  const loadingEl = unrefElement(loadingRef.value)
  if (!loadingEl) return
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
    padding: 12px 22px;
    font-size: var(--el-form-label-font-size);
    color: var(--el-text-color-regular);
  }

  &_header {
    border-bottom: 1px solid var(--el-border-color-light);
  }
  
  &_footer {
    border-top: 1px solid var(--el-border-color-light);
  }

  &_options {
    flex: 1;
  }
}
</style>