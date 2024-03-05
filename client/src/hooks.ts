import { isEqual } from 'lodash-es'
import { MaybeRefOrGetter, Ref, computed, isRef, reactive, ref, shallowReactive, watch, watchEffect, unref } from 'vue'
import { RefSymbol } from '@vue/reactivity'
import { isFunction } from '@vue/shared'

interface UseDialogOpt {
  shallow?: boolean
}

export function useDialogBind<T extends any, E extends Record<string, any>>(extra?: E, opt?: UseDialogOpt) {
  opt ||= { shallow: false }
  const ins = ref(), vis = ref(false)
  const state = (opt.shallow ? shallowReactive : reactive)({
    ...extra!,
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

type FnRef<T> = {
  (t?: T): T
  value: T
}

export function $<T>(v: MaybeRefOrGetter<T>): FnRef<T> {
  const _ = isRef(v)
    ? v : isFunction(v)
    ? computed(v) as Ref<T>
    : ref(v)
  const xxx = (...arg) => arg.length ? (_.value = arg[0]) : _.value
  Object.defineProperty(xxx, 'value', { get: () => _.value, set: v => _.value = v  })
  return xxx as any
}