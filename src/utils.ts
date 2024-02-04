import { Field, NormalizedField, NormalizedTableXXX, TableXXX } from "./props"
import { merge } from 'lodash-es'

type TableCtx = NormalizedTableXXX & {
  table: string
  keybyed: Record<string, NormalizedField>
  tables: Record<string, TableXXX>
  ctxs: Record<string, TableCtx>
}

export function findFieldPath(ctx: TableCtx, prop: string) {
  return prop.split('.').map((e, i, arr) => {
    const ret = ctx.keybyed[e]
    if (!ret) throw `找不到字段 ${prop}`
    const isLast = i == arr.length - 1
    if (!isLast && !ret.relation) throw `${prop}: ${e} 缺少 relation`
    if (!isLast) ctx = ctx.ctxs[ret.relation!.table]
    return ret
  })
}

export function normalizeField(field: Field | string, ctx: TableCtx): NormalizedField {
  if (typeof field == 'string') {
    const prop = field 
    return ctx.keybyed[prop] ||= { label: genLabel(prop), prop }
  } else {
    return ctx.keybyed[field.prop] ||= {
      ...field,
      label: field.label || genLabel(field.prop),
      relation: field.relation
        ? (() => {
          const { table } = field.relation, { map } = ctx.tables[table]
          return merge({ label: map.label, prop: map.prop || 'id' }, field.relation)
        })()
        : undefined
    }
  }

  function genLabel(prop: string) {
    return prop.split('.').length > 1 ? findFieldPath(ctx, prop).map(e => e.label).join('.') : prop
  }
}

// tables keybyed