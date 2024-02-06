import { ConfigProviderContext, Field, NormalizedField, NormalizedTableXXX, TableXXX } from '../props'
import { findFieldPath, normalizeField } from '../utils'
import { ApiAdapterInterface } from './adapter/interface'
import { prismaAdapter } from './adapter/prisma'

type TableCtx = NormalizedTableXXX & {
  table: string
  keybyed: Record<string, NormalizedField>
  tables: Record<string, TableXXX>
  ctxs: Record<string, TableCtx>
}

export function createCruds(tables: Record<string, TableXXX>) {
  const ctxs = {}
  const ins = new Proxy(ctxs, {
    get(obj, table: string) {
      return obj[table] ||= createCrud(tables, table, ins)
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

  return ins as Record<string, ReturnType<typeof createCrud>>
}

function createCrud(tables: Record<string, TableXXX>, table: string, ctxs: Record<string, TableCtx>) {
  const config = tables[table]
  if (!config) throw `找不到 Table: ${table}`
  
  const ctx: TableCtx = ctxs[table] = {
    fields: [],
    table,
    keybyed: {},
    columns: [],
    searchs: [],
    forms: [],
    tables,
    ctxs,
    btns: [],
    map: { label: config.map?.label || '', id: config.map?.id || 'id' },
  }

  config.fields.forEach((e, i) => ctx.fields[i] = normalizeField(e, ctx))
  config.columns.forEach((e, i) => ctx.columns[i] = normalizeField(e, ctx, true))
  config.searchs.forEach((e, i) => ctx.searchs[i] = normalizeField(e, ctx, true))
  config.forms.forEach((e, i) => ctx.forms[i] = normalizeField(e, ctx, true))

  // const key = ctx.map.id
  // const existKey = config.columns.some(e => typeof e == 'string' ? e == key : e.prop == key)
  // if (!existKey) ctx.columns.unshift({ ...ctx.keybyed[key], hide: true })

  Object.setPrototypeOf(ctx, prismaAdapter)

  return ctx as TableCtx & ApiAdapterInterface
}
