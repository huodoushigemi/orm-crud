import { isString, unionBy } from 'lodash-es'
import { Field, TableOpt, TableCtx, TableCtxs, FieldFilter, IApiAdapter, NormalizedField, FieldColumn } from './types'
import { genLabel, nColumns, normalizeField } from './utils'

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
    tableOpt.fields.forEach(e => nField(ctx, e))
  })

  // transform inverseSide
  const set = new WeakSet
  Object.values(ctxs).forEach(ctx => {
    const table = ctx.table
    ctx.fields.forEach(e => {
      if (set.has(e)) return
      const rel = e.relation
      if (!rel) return
      if (!e.inverseSide) throw new Error(`表 ${table} 关联字段 ${e.prop} 缺失 inverseSide`)
      const side = e.inverseSide
      const relCtx = ctxs[rel.table]
      const field = nField(relCtx, {
        label: side.label,
        prop: side.prop,
        relation: { table, rel: inverseRelMap[rel.rel] },
        inverseSide: { label: e.label, prop: e.prop }
      })
      set.add(field)
      tables[rel.table].fields.push(field)
    })
  })

  // init columns/searchs/forms/views
  Object.values(ctxs).forEach(ctx => {
    const tableOpt = tables[ctx.table]
    const views = tableOpt.views?.length ? tableOpt.views : unionBy(tableOpt.columns, tableOpt.forms, e => isString(e) ? e : e.prop)

    // tableOpt.columns?.forEach((e, i) => ctx.columns[i] = normalizeField(ctx, e))
    ctx.columns = nColumns(ctx, tableOpt.columns || [])
    tableOpt.searchs?.forEach((e, i) => ctx.searchs[i] = normalizeField(ctx, e))
    tableOpt.forms?.forEach((e, i) => ctx.forms[i] = normalizeField(ctx, e))
    views.forEach((e, i) => ctx.views[i] = normalizeField(ctx, e))
    
    if (fieldFilter) {
      const _ff = (e: { prop: string }) => fieldFilter(ctx, e.prop)
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

function nField(ctx: TableCtx, field: Field) {
  const rel = field.relation
  const inverse = field.inverseSide
  const relMap = rel ? ctx.ctxs[rel.table].map : undefined
  const nfield = ctx.keybyed[field.prop] = {
    label: field.label ?? field.prop,
    ...field,
    relation: rel ? { label: relMap!.label, prop: relMap!.id || 'id', ...rel } : undefined,
    inverseSide: inverse ? { table: ctx.table, label: inverse.label ?? inverse.prop, ...inverse } : undefined
  }
  ctx.fields.push(nfield)
  return nfield
}
