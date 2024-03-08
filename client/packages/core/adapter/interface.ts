import { TableCtx } from '../types'

type Obj = Record<string, any>
type Pageable = { $page?: number; $pageSize?: number } & Obj

export interface IApiAdapter {
  find(ctx: TableCtx, data, fields?: string[]): Promise<any>
  finds(ctx: TableCtx, data: Pageable, fields?: string[]): Promise<any[]>
  page(ctx: TableCtx, data: Pageable, fields?: string[]): Promise<{ total: number; list: any[] }>
  create(ctx: TableCtx, data): Promise<any>
  update(ctx: TableCtx, data): Promise<any>
  count(ctx: TableCtx, data): Promise<any>
  remove(ctx: TableCtx, data): Promise<any>
  removes(ctx: TableCtx, data): Promise<any>
}
