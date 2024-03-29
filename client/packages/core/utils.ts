import { Arrayable, normalizeDate } from '@vueuse/core'
import { isObject, isArray, isString } from '@vue/shared'
import { get, set, merge, isEqual, keyBy } from 'lodash-es'
import { TableCtx, Field, NormalizedField, RelField, NRelField, FieldFilter, TableOpt, FieldColumn, FieldForm } from './types'

export function findFieldPath(ctx: TableCtx, prop: string | string[], skip?: FieldFilter): NormalizedField[] {
  let _ctx = ctx
  const ps = Array.isArray(prop) ? prop : prop.split('.')
  const ret = [] as NormalizedField[]
  for (let i = 0; i < ps.length; i++) {
    const k = ps[i], field = _ctx.keybyed[k]
    if (!field) {
      throw new Error(`表 ${ctx.table} 找不到字段 ${prop}`)
    }
    const isLast = i == ps.length - 1
    if (!isLast && !field.relation) {
      throw new Error(`${prop}: ${k} 缺少 relation`)
    }
    if (!skip?.(_ctx, k)) ret.push(field)
    if (!isLast) _ctx = _ctx.ctxs[field.relation!.table]
  }
  return ret
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
            { label: map.label, prop: map.id } as Partial<NRelField['relation']>,
            field.relation
          )
        })()
        : undefined
    } as NormalizedField
    if (cache && ret.editor) cache.editor ||= ret.editor
    if (cache && ret.render) cache.render ||= ret.render
    return ret
  }
}

export function nColumns(ctx: TableCtx, arr: (Field | string)[]): FieldColumn[] {
  const keybyed = keyBy(ctx.columns, e => isString(e) ? e : e.prop)
  const _prop = (e: string | { prop: string }) => isString(e) ? e : e.prop
  return arr.map(e => {
    const prop = _prop(e)
    const field = ctx.keybyed[prop] as NormalizedField | undefined
    const col1 = isString(keybyed[prop]) ? undefined : keybyed[prop]
    const col2 = isString(e) ? undefined : e
    let relField: Field | undefined
    let relCol: FieldColumn | undefined
    if (prop.includes('.')) {
      const ps = prop.split('.')
      const relProp = ps[ps.length - 1], aaa = ps.slice(0, -1)
      const _ctx = aaa.reduce((_ctx, prop) => ctx.ctxs[_ctx.keybyed[prop].relation!.table], ctx)
      relField = _ctx.keybyed[relProp]
      relCol = _ctx.columns.find(e => _prop(e) == relProp)
    }
    return {
      render: field?.render ?? relField?.render,
      options: field?.options ?? relField?.options,
      ...relCol,
      label: genLabel(ctx, prop),
      prop,
      ...col1,
      ...col2,
    }
  })
}

export function nForms(ctx: TableCtx, arr: (Field | string)[]): FieldForm[] {
  const keybyed = keyBy(ctx.forms, e => isString(e) ? e : e.prop)
  const _prop = (e: string | { prop: string }) => isString(e) ? e : e.prop
  return arr.map(e => {
    const prop = isString(e) ? e : e.prop
    const field = ctx.keybyed[prop] as NormalizedField | undefined
    const item1 = isString(keybyed[prop]) ? undefined : keybyed[prop]
    const item2 = isString(e) ? undefined : e
    let relField: Field | undefined
    let relItem: FieldForm | undefined
    if (prop.includes('.')) {
      const ps = prop.split('.')
      const relProp = ps[ps.length - 1], aaa = ps.slice(0, -1)
      const _ctx = aaa.reduce((_ctx, prop) => ctx.ctxs[_ctx.keybyed[prop].relation!.table], ctx)
      relField = _ctx.keybyed[relProp]
      relItem = _ctx.forms.find(e => _prop(e) == relProp)
    }
    return {
      options: relField?.options,
      required: field?.required ?? relField?.required,
      editable: field?.editable ?? relField?.editable,
      ...relItem,
      label: genLabel(ctx, prop),
      prop,
      ...item1,
      ...item2,
      el: { ...relField?.editor, ...relItem?.el, ...field?.editor, ...item1?.el, ...item2?.el },
    }
  })
}

export function genLabel(ctx: TableCtx, prop: string) {
  return prop.includes('.') ? findFieldPath(ctx, prop, ctx => ctx.middle).map(e => e.label).join('.') : ctx.keybyed[prop]?.label ?? prop
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
 * e.g: following.posts.tag -> posts.author.followedBy
 */
export function pathReverse(ctx: TableCtx, ps: string[] | string) {
  const { ctxs } = ctx
  const arr = isArray(ps) ? ps : ps.split('.')
  let ret = <string[]>[]
  arr.forEach(e => {
    const col = ctx.keybyed[e]
    ret.push(col.inverseSide!.prop)
    ctx = ctxs[col.relation!.table]
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

/**
 * 对比数据，返回最小化的改变
 */
export function diff(ctx: TableCtx, d1, d2) {
  const ret = {}
  for (let k in d1) {
    const v1 = d1[k], v2 = d2[k]
    if (isEqual(v1, v2)) continue
    if (isObject(v1) || isObject(v2)) {
      const _ctx = ctx.ctxs[ctx.keybyed[k].relation!.table]
      // 取消关联
      if (v1 == null && v2 != null) {
        ret[k] = null
        ret[`${k}-`] = v2
      }
      // 建立关联
      else if (v1 != null && v2 == null) {
        ret[k] = v1
        ret[`${k}+`] = v1
      }
      else {
        if (isArray(v1)) {
          const { id } = _ctx.map
          const keybyed1 = keyBy(v1, id), keybyed2 = keyBy(v2, id)
          const list: any[] = ret[k] = []
          const cons: any[] = ret[`${k}+`] = []
          const diss: any[] = ret[`${k}-`] = []
          v1.forEach(e => {
            const e2 = keybyed2[e[id]]
            if (e[id] == null) {
              cons.push(e)
            }
            else if (e[id] == null || e2 == null) {
              list.push(e)
              cons.push(e)
            }
            else if (!isEqual(e, e2)) {
              list.push(diff(_ctx, e, e2))
            }
          })
          v2.forEach(e => {
            if (keybyed1[e[id]] == null) {
              diss.push(e)
            }
          })
        }
        else {
          ret[k] = diff(_ctx, v1, v2)
        }
      }
    }
    else {
      ret[k] = v1
    }
  }
  return ret
}

/**
 * 返回无权限的标识
 */
export function checkDataPermis(ctx: TableCtx, data: any, cb: (flag: string) => boolean) {
  return dataWalker(ctx, data, (ctx, field) => {
    if (!cb(ctx.table)) return ctx.table
    if (ctx.map.id == field.prop) return

    if (field.relation) return
    
    const flag = `${ctx.table}.${field.prop}`
    if (!cb(flag)) return flag
  })
}

/**
 * 过滤无权限的字段
 */
export function fieldsFilter<T extends string | { prop: any }>(ctx: TableCtx, fields: T[], cb: (flag: string) => boolean) {
  return fields.filter(e => fieldFilter(ctx, isString(e) ? e : e.prop, cb))
}

/**
 * 字段是否有权限
 */
export function fieldFilter(ctx: TableCtx, prop: string, cb: (flag: string) => boolean) {
  let table = ctx.table
  if (table && !cb(table)) return false
  
  if (prop.includes('.')) {
    const nFields = findFieldPath(ctx, prop)
    for (let i = 0; i < nFields.length; i++) {
      if (nFields[i].relation) {
        table = nFields[i].relation!.table
      }
      else {
        const flag = `${table}.${nFields[i].prop}`
        if (!cb(flag)) return false
      }
  
      if (table && !cb(table)) return false
    }
  }
  else {
    const nField = normalizeField(ctx, prop)
    if (nField.relation) {
      table = nField.relation.table
      return cb(table)
    } else {
      const flag = `${ctx.table}.${prop}`
      return cb(flag)
    }
  }
  return true
}

/**
 * 遍历数据，cb 返回值时会停止遍历并将其返回
 */
export function dataWalker(ctx: TableCtx, data: Record<string, any>, cb: (ctx: TableCtx, field: NormalizedField) => any) {
  for (let k in data) {
    if (k[0] == '$') return
    const field = ctx.keybyed[k]
    if (field.relation) {
      if (isArray(data[k])) {
        const arr = data[k]
        let ret: string
        for (let i = 0; i < arr.length; i++) {
          ret = cb(ctx, arr[i])
          if (ret !== undefined) return ret

          const relCtx = ctx.ctxs[field.relation.table]
          dataWalker(relCtx, arr[i], cb)
        }
      }
      else {
        return dataWalker(ctx.ctxs[field.relation.table], data[k], cb)
      }
    }
    else {
      const ret = cb(ctx, field)
      if (ret !== undefined) return ret
    }
  }
}