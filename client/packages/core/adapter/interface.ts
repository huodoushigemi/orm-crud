import { TableCtx } from '../types'

type Obj = Record<string, any>

export type FindOpt = {
  where: Record<string, any>
  select?: string[]
  orderBy?: Record<string, 'asc' | 'desc' | undefined>
  skip?: number
  take?: number

}

export interface IApiAdapter {
  find(ctx: TableCtx, opt: FindOpt): Promise<any>
  finds(ctx: TableCtx, opt: FindOpt): Promise<any[]>
  page(ctx: TableCtx, opt: FindOpt): Promise<{ total: number; list: any[] }>
  count(ctx: TableCtx, opt: FindOpt): Promise<any>
  create(ctx: TableCtx, data): Promise<any>
  update(ctx: TableCtx, data): Promise<any>
  remove(ctx: TableCtx, data): Promise<any>
  removes(ctx: TableCtx, data): Promise<any>
}
