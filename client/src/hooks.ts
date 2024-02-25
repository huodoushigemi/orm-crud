import { isEqual } from 'lodash-es'
import { computed, reactive, ref, shallowReactive, watch, watchEffect } from 'vue'

interface UseDialogOpt {
  shallow: boolean
}

export function useDialog<T extends any>(data: T, opt?: UseDialogOpt) {
  opt ||= { shallow: false }
  const ins = ref(), vis = ref(false)
  const state = (opt.shallow ? shallowReactive : reactive)({
    modelValue: vis,
    vis,
    data: undefined as T | undefined,
    ref: el => ins.value = el,
    ins,
    onClosed: () => state.data = undefined,
    'onUpdate:modelValue': v => vis.value = v,
    'onUpdate:vis': v => vis.value = v,
    'onUpdate:data': v => state.data = v,
  })

  watch(() => state.data, v => {
    if (v == null) return
    vis.value = true
  })

  return state
}

export function useStorage<T>(key: () => string, opt: { default: () => T }) {
  const val = ref<T>(calcVal())
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