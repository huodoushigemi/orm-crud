import { Arrayable } from '@vueuse/core'
import { merge } from 'lodash-es'
import { TableCtx } from './crud'
import { Field, NormalizedField, NormalizedTableXXX, Relation, TableXXX } from './props'

export function findFieldPath(ctx: TableCtx, prop: string | string[]): NormalizedField[] {
  return (Array.isArray(prop) ? prop : prop.split('.')).map((e, i, arr) => {
    const ret = ctx.keybyed[e]
    if (!ret) throw new Error(`找不到字段 ${prop}`)
    const isLast = i == arr.length - 1
    if (!isLast && !ret.relation) throw new Error(`${prop}: ${e} 缺少 relation`)
    if (!isLast) ctx = ctx.ctxs[ret.relation!.table]
    return ret
  })
}

export function normalizeField(field: Field | string, ctx: TableCtx, assign?: boolean): NormalizedField {
  if (typeof field == 'string') {
    const prop = field
    const leaf = findFieldPath(ctx, prop).slice(-1)[0]
    return ctx.keybyed[prop] ||= {
      ...leaf,
      label: genLabel(prop, ctx),
      prop,
    }
  } else {
    const cache = ctx.keybyed[field.prop]
    const ret = {
      ...cache,
      ...field,
      label: field.label || cache?.label || genLabel(field.prop, ctx),
      relation: field.relation
        ? (() => {
          const { table } = field.relation, { map } = ctx.ctxs[table]
          return merge(
            { rel: '1-1', label: map.label, prop: map.id } as Required<Relation>,
            field.relation
          )
        })()
        : undefined
    }
    return assign ? ret : (ctx.keybyed[field.prop] ||= ret)
  }

}

export function genLabel(prop: string, ctx: TableCtx) {
  return prop.split('.').length > 1 ? findFieldPath(ctx, prop).map(e => e.label).join('.') : prop
}

export function getP(obj, prop) {
  const ps = Array.isArray(prop) ? prop : prop.split('.')
  let isarr
  for (let i = 0; i < ps.length; i++) {
    const k = ps[i]
    isarr || (isarr = Array.isArray(obj))
    obj = isarr ? obj.map(e => e && e[k]).filter(e => e != null).flat() : obj[k]
    if (!obj) return obj
    if (isarr && !obj.length) return undefined
  }
  return obj
}

export const toArr = <T>(arr?: Arrayable<T>) => Array.isArray(arr) ? arr : (arr == null ? [] : [arr])

export const isRelMany = (rel: RelField['relation']['rel']) => rel == '1-n' || rel == 'm-n'
export const isRelOne = (rel: RelField['relation']['rel']) => rel == '1-1' || rel == 'n-1'