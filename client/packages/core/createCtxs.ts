import { isString, unionBy } from 'lodash-es'
import { Field, TableOpt } from './types'
import { normalizeField } from './utils'
import { ApiAdapterInterface } from './adapter/interface'
import { prismaAdapter } from './adapter/prisma'
import { TableCtx } from './types'

type FieldFilter = (ctx: TableCtx, prop: string) => boolean

export function createCtxs(tables: Record<string, TableOpt>, fieldFilter?: FieldFilter) {
  const ctxs = new Proxy({}, {
    get(obj, table: string, receiver) {
      return obj[table] ||= createCtx(tables, table, ctxs, fieldFilter)
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

  return ctxs as Record<string, ReturnType<typeof createCtx>>
}

function createCtx(tables: Record<string, TableOpt>, table: string, ctxs: Record<string, TableCtx>, fieldFilter?: FieldFilter) {
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
    middle: config.middle || false,
    map: { label: config.map?.label || '', id: config.map?.id || 'id' },
    ...prismaAdapter
  }

  const _ff = (e: Field | string) => fieldFilter ? fieldFilter(ctx, isString(e) ? e : e.prop) : true
  const views = config.views?.length ? config.views : unionBy(config.columns, config.forms, e => isString(e) ? e : e.prop)
  
  config.fields.forEach((e, i) => ctx.fields[i] = normalizeField(ctx, e))
  config.columns?.forEach((e, i) => ctx.columns[i] = normalizeField(ctx, e))
  config.searchs?.forEach((e, i) => ctx.searchs[i] = normalizeField(ctx, e))
  config.forms?.forEach((e, i) => ctx.forms[i] = normalizeField(ctx, e))
  views.filter(_ff).forEach((e, i) => ctx.views[i] = normalizeField(ctx, e))
  
  ctx.columns = ctx.columns.filter(_ff)
  ctx.searchs = ctx.searchs.filter(_ff)
  ctx.forms = ctx.forms.filter(_ff)
  ctx.fields = ctx.fields.filter(_ff)

  Object.freeze(ctx)

  // Object.setPrototypeOf(ctx, prismaAdapter)

  return ctx as TableCtx & ApiAdapterInterface
}
