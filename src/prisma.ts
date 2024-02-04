import { isPlainObject } from "@vue/shared";
import { get, set, keyBy } from 'lodash-es'
import { ConfigProviderContext, Field, NormalizedField, NormalizedTableXXX, TableXXX } from "./props";
import { objectPick } from "@vueuse/core";
import { findFieldPath, normalizeField } from "./utils";

export function useCrud() {

}

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
    map: { label: config.map?.label || '', prop: config.map?.prop || 'id' },
  }

  config.fields.forEach((e, i) => ctx.fields[i] = normalizeField(e, ctx))
  config.columns.forEach((e, i) => ctx.columns[i] = normalizeField(e, ctx))
  config.searchs.forEach((e, i) => ctx.searchs[i] = normalizeField(e, ctx))
  config.forms.forEach((e, i) => ctx.forms[i] = normalizeField(e, ctx))

  const crud = { find, finds, create, update, remove, removes }
  Object.setPrototypeOf(ctx, crud)

  return ctx as TableCtx & typeof crud
}

function find(this: TableCtx, data) {
  return {
    table: this.table,
    action: 'find',
    argv: {
      select: select(this.fields),
      where: data,
    }
  }
}

function finds(this: TableCtx, data) {
  const extraQueryKs = Object.keys(data).filter(k => !this.searchs.find(e => e.prop.split('.')[0] == k))
  const extraQs = objectPick(data, extraQueryKs as any)
  return {
    table: this.table,
    action: 'findMany',
    argv: {
      select: select(this.fields),
      where: where(this, data),
      // todo
      // @ts-ignore
      skip: (extraQs.page.page - 1) * extraQs.page.pageSize,
      // @ts-ignore
      take: extraQs.page.pageSize
    }
  }
}

function create(this: TableCtx, data) {
  return {
    table: this.table,
    action: 'create',
    argv: {
      data: {
        ...data,
        ...this.forms.filter(e => e.relation).reduce((o, e) => (o[e.prop] = { connect: data[e.prop] || void 0 }, o), {})
      }
    }
  }
}

function update(this: TableCtx, data) {
  return {
    table: this.table,
    action: 'update',
    argv: {
      data: {
        ...data,
        ...this.forms.filter(e => e.relation).reduce((o, e) => (o[e.prop] = { set: [], connect: data[e.prop] || void 0 }, o), {})
      },
      where: { id: data.id }
    }
  }
}

function remove(this: TableCtx, data) {
  return {
    table: this.table,
    action: 'delete',
    argv: {
      where: { id: data.id }
    }
  }
}

function removes(this: TableCtx, data) {
  return {
    table: this.table,
    action: 'delete',
    argv: {
      where: {
        id: { in: data.map(e => e.id) }
      }
    }
  }
}


function select(fields: NormalizedField[]) {
  const rels = fields.filter(e => e.relation).reduce((o, e) => (set(o, e.prop.replace(/\./, '.select.'), {}), o), {})
  const copy = (obj) => Object.keys(obj).reduce((o, k) => (o[k] = isPlainObject(o[k]) && Object.keys(o[k]).length ? copy(o[k]) : true, o), {})
  return {
    ...Object.fromEntries(fields.map(e => [e.prop, true])),
    ...copy(rels)
  }
}

function where(ctx: TableCtx, data: any) {
  const { searchs } = ctx
  const ret = {}
  searchs.map(field => {
    const ps = findFieldPath(ctx, field.prop)
    const path = <string[]>[]
    ps.forEach((e, i) => {
      const [f1, f2] = e.filter?.split('.') || []
      f2 && path.push(f2)
      path.push(e.prop)
      f1 && path.push(f1)
      if (i == ps.length - 1) {
        if (field.relation) {
          path.push(field.relation.prop)
        }
        else if (field.filter) {
          if (e.filter) path[ps.length - 1] = field.filter
          else path.push(field.filter)
        }
      }
    })
    const val = get(data, field.prop)
    if (val != null) set(ret, path.join('.'), val)
  })

  return ret
}
