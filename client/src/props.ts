import { TableOpt, createCtxs } from '@orm-crud/core'
import { IRWPermis } from './RWPermis'

export interface ConfigProviderProps {
  tables: Record<string, TableOpt>
  rwMap: Record<string, number>
}

export interface ConfigProviderContext {
  tables: Record<string, TableOpt>
  ctxs: ReturnType<typeof createCtxs>
  rwPermis: IRWPermis
}