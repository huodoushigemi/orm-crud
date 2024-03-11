import { isString, unionBy } from 'lodash-es'
import { Field, TableOpt, TableCtx, TableCtxs, FieldFilter, IApiAdapter, NormalizedField } from './types'
import { normalizeField } from './utils'

type CreateCtxsOptions = {
  fieldFilter?: FieldFilter
  api?: IApiAdapter
}

const inverseRelMap = {
  '1-1': '1-1',
  '1-n': 'n-1',
  'n-1': '1-n',
  'm-n': 'm-n',
} as const

export function createCtxs(tables: Record<string, TableOpt>, opt?: CreateCtxsOptions): TableCtxs {
  // init inverseSide
  const set = new WeakSet
  Object.keys(tables).forEach(table => {
    const tableOpt = tables[table]
    tableOpt.fields.forEach(e => {
      if (set.has(e)) return
      const rel = e.relation
      if (!rel || !e.inverseSide) return
      if (rel) {
        const side = e?.inverseSide
        const field: Field = {
          label: side.label,
          prop: side.prop,
          relation: {
            table,
            rel: inverseRelMap[rel.rel],
          },
          inverseSide: { label: e.label, prop: e.prop }
        }
        set.add(field)
        tables[rel.table].fields.push(field)
      }
    })
  })

  const ctxs = new Proxy({}, {
    get(obj, table: string, receiver) {
      return obj[table] ||= createCtx(tables, table, ctxs, opt)
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

  return ctxs
}

function createCtx(tables: Record<string, TableOpt>, table: string, ctxs: TableCtxs, opt?: CreateCtxsOptions) {
  const config = tables[table]
  
  if (!config) throw new Error(`找不到 Table: ${table}`)

  const { fieldFilter, api = {} } = opt || {}
  
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
    map: ((pk) => ({ label: config.map?.label || pk, id: pk }))(config.map?.id || 'id'),
    api: Object.keys(api).reduce((o, k) => (o[k] = (...args) => api[k](ctx, ...args), o), {}) as any
  }

  const views = config.views?.length ? config.views : unionBy(config.columns, config.forms, e => isString(e) ? e : e.prop)
  
  config.fields.forEach((e, i) => ctx.fields[i] = normalizeField(ctx, e))
  config.columns?.forEach((e, i) => ctx.columns[i] = normalizeField(ctx, e))
  config.searchs?.forEach((e, i) => ctx.searchs[i] = normalizeField(ctx, e))
  config.forms?.forEach((e, i) => ctx.forms[i] = normalizeField(ctx, e))
  views.forEach((e, i) => ctx.views[i] = normalizeField(ctx, e))
  
  if (fieldFilter) {
    const _ff = (e: Field | string) => fieldFilter(ctx, isString(e) ? e : e.prop)
    ctx.views = ctx.views.filter(_ff)
    ctx.columns = ctx.columns.filter(_ff)
    ctx.searchs = ctx.searchs.filter(_ff)
    ctx.forms = ctx.forms.filter(_ff)
    ctx.fields = ctx.fields.filter(_ff)
  }

  Object.freeze(ctx)

  return ctx
}
