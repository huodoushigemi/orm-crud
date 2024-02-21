import { NormalizedField, NormalizedTableXXX, TableOpt } from '../props'
import { normalizeField } from '../utils'
import { ApiAdapterInterface } from './adapter/interface'
import { prismaAdapter } from './adapter/prisma'

export type TableCtx = NormalizedTableXXX & ApiAdapterInterface & {
  table: string
  keybyed: Record<string, NormalizedField>
  tables: Record<string, TableOpt>
  ctxs: Record<string, TableCtx>
}

export function createCruds(tables: Record<string, TableOpt>) {
  const ctxs = new Proxy({}, {
    get(obj, table: string, receiver) {
      return obj[table] ||= createCrud(tables, table, ctxs)
    },
    set(obj, table: string, val) {
      obj[table] = val
      return true
    },
    ownKeys() {
      return Object.keys(tables)
    },
    has(_, p) {
      return Reflect.has(tables, p)
    },
    getOwnPropertyDescriptor() {
      return { enumerable: true, configurable: true }
    }
  })

  return ctxs as Record<string, ReturnType<typeof createCrud>>
}

function createCrud(tables: Record<string, TableOpt>, table: string, ctxs: Record<string, TableCtx>) {
  const config = tables[table]
  
  if (!config) throw new Error(`找不到 Table: ${table}`)
  
  const ctx: TableCtx = ctxs[table] = {
    ...config,
    fields: [],
    get rels() { return this.fields.filter(e => e.relation) as any },
    table,
    keybyed: {},
    columns: [],
    searchs: [],
    forms: [],
    views: [],
    tables,
    ctxs,
    btns: [],
    map: { label: config.map?.label || '', id: config.map?.id || 'id' },
    ...prismaAdapter
  }

  config.fields.forEach((e, i) => ctx.fields[i] = normalizeField(e, ctx))
  config.columns.forEach((e, i) => ctx.columns[i] = normalizeField(e, ctx, true))
  config.searchs.forEach((e, i) => ctx.searchs[i] = normalizeField(e, ctx, true))
  config.forms.forEach((e, i) => ctx.forms[i] = normalizeField(e, ctx, true))

  Object.freeze(ctx)

  // Object.setPrototypeOf(ctx, prismaAdapter)

  return ctx as TableCtx & ApiAdapterInterface
}
