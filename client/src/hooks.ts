import { computed, reactive, ref, shallowReactive, watch } from 'vue'

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