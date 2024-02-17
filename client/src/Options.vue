<template>
  <el-scrollbar class="orm-options" view-class="orm-options_list" tag="ul" role="listbox">
    <li
      v-for="opt in options"
      :class="['orm-option', isSelect(opt) && 'is-active']"
      role="option"
      @click="onClick(opt)"
    >
      {{ opt[replace.label] }}
    </li>
    <slot />
  </el-scrollbar>
</template>

<script setup lang="ts">
import { isArray, isObject } from '@vue/shared'
import { Arrayable } from '@vueuse/core'

type Obj = Record<string, any>

const props = withDefaults(defineProps<{
  modelValue: Arrayable<Obj | string | number>
  options: any[]
  replace?: { label: string, value: string }
  obj?: boolean
  clearable?: boolean
  multiple?: boolean
}>(), {
  replace: () => ({ label: 'label', value: 'value' })
})

const emit = defineEmits(['update:modelValue', 'change'])

function onClick(opt) {
  const { multiple, obj, replace: { label, value } } = props
  const genObj = () => ({ [value]: opt[value], [label]: opt[label] })
  let val
  if (multiple) {
    val = (props.modelValue || []) as any[]
    const i = val.findIndex(e => isSelect2(opt, e))
    ~i ? val.splice(i, 1) : val.push(obj ? genObj() : opt[value])
  }
  else if (props.clearable && isSelect(opt)) {
    val = undefined
  } else {
    val = obj ? genObj() : opt[value]
  }
  emit('update:modelValue', val)
  emit('change', val)
}

function isSelect(opt) {
  const val = props.modelValue
  return props.multiple ? ((val || []) as any[]).some(e => isSelect2(opt, e)) : isSelect2(opt, val)
}

function isSelect2(opt, val) {
  const { value } = props.replace
  return isObject(val) ? val[value] === opt[value] : val === opt[value]
}
</script>

<style lang="scss">
.orm-options {
  border-radius: 4px;
  background: var(--el-bg-color-overlay);

  &_list {
    margin: 0;
    padding: 6px 0;
    list-style: none;
  }
}

.orm-option {
  padding: 0 22px;
  line-height: 34px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-regular);
  cursor: pointer;

  &:hover {
    background-color: var(--el-fill-color-light);
  }

  &.is-active {
    color: var(--el-color-primary);
    font-weight: 700;
    background-color: rgba(var(--el-color-primary-rgb), .1);
  }
}
</style>