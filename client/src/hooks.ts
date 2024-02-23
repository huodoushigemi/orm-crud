import { isEqual } from 'lodash-es'
import { computed, reactive, ref, shallowReactive, watch, watchEffect } from 'vue'

interface UseDialogOpt {
  shallow: boolean
}

export function useDialog<T extends any>(data: T, opt: UseDialogOpt) {
  const state = (opt.shallow ? shallowReactive : reactive)({
    modelValue: false,
    data: undefined as T | undefined,
    ref: ref(),
    ins: computed(() => state.ref.values),
    onClosed: () => state.data = undefined,
    'onUpdate:modelValue': v => state.modelValue = v,
    'onUpdate:data': v => state.data = v,
  })

  watch(() => state.data, v => {
    if (v != null) return
    state.modelValue = true
  })

  return state
}

export function useStorage(key: () => string, opt: { default: () => any }) {
  const val = ref(calcVal())
  watch(calcVal, v => val.value = v)
  watchEffect(() => {
    const eq = isEqual(val.value, opt.default())
    if (eq) {
      localStorage.removeItem(key())
    } else {
      localStorage.setItem(key(), JSON.stringify(val.value))
    }
  })
  function calcVal() {
    const stored = JSON.parse(localStorage.getItem(key()) || 'null')
    return stored ?? opt.default()
  }
  return val
}