import { IApiAdapter, TableOpt, createCtxs } from '@orm-crud/core'
import { IRWPermis } from './RWPermis'

export interface ConfigProviderProps {
  tables: Record<string, TableOpt>
  api: IApiAdapter
  rwPermis?: IRWPermis
}

export interface ConfigProviderContext extends ConfigProviderProps {
  ctxs: ReturnType<typeof createCtxs>
}