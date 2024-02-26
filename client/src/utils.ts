import { Arrayable } from '@vueuse/core'
import { isObject, isArray } from '@vue/shared'
import { get, set, merge, unionBy } from 'lodash-es'
import { TableCtx } from './crud'
import { Field, NormalizedField, NormalizedTableOpt, RelField, Relation, TableOpt } from './props'

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

export function normalizeField(ctx: TableCtx, field: Field | string): NormalizedField {
  if (typeof field == 'string') {
    const prop = field
    const leaf = findFieldPath(ctx, prop).slice(-1)[0]
    return ctx.keybyed[prop] ||= {
      ...leaf,
      label: genLabel(ctx, prop),
      prop,
    }
  } else {
    const cache = ctx.keybyed[field.prop]
    const ret = {
      ...cache,
      ...field,
      label: field.label || cache?.label || genLabel(ctx, field.prop),
      relation: field.relation
        ? (() => {
          const { table } = field.relation, { map } = ctx.ctxs[table]
          return merge(
            { rel: '1-1', label: map.label, prop: map.id } as Required<Relation>,
            field.relation
          )
        })()
        : undefined
    } as NormalizedField
    if (cache && ret.editor) cache.editor ||= ret.editor
    if (cache && ret.render) cache.render ||= ret.render
    return ctx.keybyed[field.prop] ||= ret
  }

}

export function genLabel(ctx: TableCtx, prop: string) {
  return prop.split('.').length > 1 ? findFieldPath(ctx, prop).map(e => e.label).join('.') : prop
}

export function getP(obj, prop) {
  const ps = isArray(prop) ? prop : prop.split('.')
  let isarr
  for (let i = 0; i < ps.length; i++) {
    const k = ps[i]
    isarr || (isarr = isArray(obj))
    obj = isarr ? obj.map(e => e && e[k]).filter(e => e != null).flat() : obj[k]
    if (!obj) return obj
    if (isarr && !obj.length) return undefined
  }
  return obj
}

export const pickPath = (obj, paths: string[]) => paths.reduce((o, k) => set(o, k, get(obj, k)), {})
export const pickLP = (obj, props: { label: string; prop?: string; value?: string }) => obj && pickPath(obj, [props.prop || props.value!, props.label])

export const toArr = <T>(arr?: Arrayable<T>) => isArray(arr) ? arr : (arr == null ? [] : [arr])

export const isRelMany = (rel?: RelField['relation']['rel']) => rel == '1-n' || rel == 'm-n'
export const isRelOne = (rel?: RelField['relation']['rel']) => rel == '1-1' || rel == 'n-1'

/**
 * todo
 * e.g: { 'a.e': 1, a: { 'b.c': 1 } } -> { a: { e: 1, b: { c: 1 } } }
 */
export function normalObj(obj: Record<string, any>) {
  const ret = {}
  function rrr(obj, ps = <string>[]) {
    for (let k in obj) {
      ps.push(k)
      const v = obj[k]
      if (isObject(v)) set(ret, k, rrr(v, ps))
      else set(ret, k, v)
      ps.pop()
    }
  }
  return ret
}

/**
 * e.g: following.posts.tag -> posts.author.followedBy
 */
export function pathReverse(ctx: TableCtx, ps: string[] | string) {
  const { ctxs } = ctx
  const arr = isArray(ps) ? ps : ps.split('.')
  let ret = <string[]>[]
  arr.forEach(e => {
    const col = ctx.keybyed[e], rel = col.relation!
    const ctx2 = ctxs[rel.table]
    const col2 = ctx2.rels.find(e => 
      e.relation!.table == ctx.table
      && e.relation!.name == rel.name
      && (ctx2.table != ctx.table || e.prop != col.prop)
    )!
    ret.push(col2.prop)
    ctx = ctx2
  })
  return ret.reverse().join('.')
}

export function inMany(ctx: TableCtx, path: string | string[]) {
  return findFieldPath(ctx, path).slice(0, -1).some(e => isRelMany(e.relation!.rel))
}

export function fieldEditor(ctx: TableCtx, field: NormalizedField) {
  let type: string | undefined
  type = ctx.forms.find(e => field.prop == e.prop)?.type
  type ||= ctx.keybyed[field.prop].type
  if (!field.prop.includes('.')) return type || 'input'
  // type ||= 
  const paths = findFieldPath(ctx, field.prop)
  const leaf = paths[paths.length - 1]
  if (leaf.editor) leaf.editor
}