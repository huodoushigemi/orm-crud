import { TableCtx } from '../../utils'

type Obj = Record<string, any>
type Pageable = { $page?: number; $pageSize?: number } & Obj

export interface ApiAdapterInterface {
  find(this: TableCtx, data): Promise<any>
  finds(this: TableCtx, data: Pageable): Promise<any[]>
  create(this: TableCtx, data): Promise<any>
  update(this: TableCtx, data): Promise<any>
  count(this: TableCtx, data): Promise<any>
  page(this: TableCtx, data: Pageable): Promise<{ total: number; list: any[] }>
  remove(this: TableCtx, data): Promise<any>
  removes(this: TableCtx, data): Promise<any>
}
