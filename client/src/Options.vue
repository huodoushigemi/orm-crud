<template>
  <el-scrollbar class="orm-options" view-class="orm-options_list" tag="ul" role="listbox">
    <li
      v-for="opt in options"
      :class="['orm-option', isSelect(opt) && 'is-active']"
      role="option"
      @click="onClick(opt)"
    >
      {{ get(opt, props.props.label) }}
    </li>
    <slot />
  </el-scrollbar>
</template>

<script setup lang="ts">
import { isObject } from '@vue/shared'
import { Arrayable } from '@vueuse/core'
import { get } from 'lodash-es'
import { toArr, pickLP } from './utils'

type Obj = Record<string, any>

const props = withDefaults(defineProps<{
  modelValue: Arrayable<Obj | string | number>
  options: any[]
  props: { label: string, value: string }
  obj?: boolean
  clearable?: boolean
  multiple?: boolean
}>(), {
  props: () => ({ label: 'label', value: 'value' })
})

const emit = defineEmits(['update:modelValue', 'change'])

function onClick(opt) {
  const { multiple, obj, props: _props } = props
  let val
  if (multiple) {
    val = toArr(props.modelValue)
    const i = val.findIndex(e => eqOpt(opt, e))
    ~i ? val.splice(i, 1) : val.push(obj ? pickLP(opt, _props) : get(opt, _props.value))
  }
  else if (props.clearable && isSelect(opt)) {
    val = undefined
  } else {
    val = obj ? pickLP(opt, _props) : get(opt, _props.value)
  }
  emit('update:modelValue', val)
  emit('change', val)
}

function isSelect(opt) {
  const val = props.modelValue
  return props.multiple ? toArr(val).some(e => eqOpt(opt, e)) : eqOpt(opt, val)
}

function eqOpt(opt, val) {
  const { value } = props.props
  return isObject(val) ? get(val, value) === get(opt, value) : val === get(opt, value)
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
  padding: 0 18px;
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