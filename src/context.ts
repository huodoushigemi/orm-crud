import { InjectionKey, inject } from "vue"
import { ConfigProviderContext } from "./props"

export const configContextKey = Symbol() as InjectionKey<ConfigProviderContext>

export function useConfig() {
  return inject(configContextKey)
}
