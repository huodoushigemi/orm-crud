import { isString, unionBy } from 'lodash-es'
import { Field, TableOpt, TableCtx, TableCtxs, FieldFilter, IApiAdapter, NormalizedField } from './types'
import { genLabel, normalizeField } from './utils'

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
  const { fieldFilter, api = {} } = opt || {}
  
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

  // init ctxs
  const ctxs = Object.keys(tables).reduce((ctxs, table) => {
    const tableOpt = tables[table]
    ctxs[table] = {
      ...tableOpt,
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
      middle: tableOpt.middle || false,
      map: ((pk) => ({ label: tableOpt.map?.label || pk, id: pk }))(tableOpt.map?.id || 'id'),
      api: Object.keys(api).reduce((o, k) => (o[k] = (...args) => api[k](ctxs[table], ...args), o), {}) as any
    }
    return ctxs
  }, {} as TableCtxs)

  // init fields
  Object.values(ctxs).forEach(ctx => {
    const tableOpt = tables[ctx.table]
    tableOpt.fields.forEach((e, i) => {
      const rel = e.relation
      ctx.keybyed[e.prop] = ctx.fields[i] = {
        ...e,
        label: e.label || e.prop,
        relation: rel ? { ...rel, label: ctxs[rel.table].map.label, prop: ctxs[rel.table].map.id || 'id' } : undefined,
      }
    })
  })

  // init columns/searchs/forms/views
  Object.values(ctxs).forEach(ctx => {
    const tableOpt = tables[ctx.table]
    const views = tableOpt.views?.length ? tableOpt.views : unionBy(tableOpt.columns, tableOpt.forms, e => isString(e) ? e : e.prop)

    tableOpt.columns?.forEach((e, i) => ctx.columns[i] = normalizeField(ctx, e))
    tableOpt.searchs?.forEach((e, i) => ctx.searchs[i] = normalizeField(ctx, e))
    tableOpt.forms?.forEach((e, i) => ctx.forms[i] = normalizeField(ctx, e))
    views.forEach((e, i) => ctx.views[i] = normalizeField(ctx, e))
    
    if (fieldFilter) {
      const _ff = (e: NormalizedField) => fieldFilter(ctx, e.prop)
      ctx.views = ctx.views.filter(_ff)
      ctx.columns = ctx.columns.filter(_ff)
      ctx.searchs = ctx.searchs.filter(_ff)
      ctx.forms = ctx.forms.filter(_ff)
      ctx.fields = ctx.fields.filter(_ff)
    }
  })

  Object.freeze(ctxs)

  return ctxs
}
