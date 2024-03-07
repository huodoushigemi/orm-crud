import { Arrayable } from '@vueuse/core'
import { isObject, isArray } from '@vue/shared'
import { get, set, merge, isEqual, keyBy } from 'lodash-es'
import { TableCtx } from './crud'
import { Field, NormalizedField, RelField, Relation } from './props'

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
export function checkPermis(ctx: TableCtx, data: any, cb: (flag: string) => boolean) {
  return dataWalker(ctx, data, (ctx, field) => {
    if (!cb(ctx.table)) return ctx.table
    if (ctx.map.id == field.prop) return

    if (field.relation) return
    
    const flag = `${ctx.table}.${field.prop}`
    if (!cb(p)) return flag
  })
}

/**
 * 过滤无权限的字段
 */
export function fieldsFilter(ctx: TableCtx, fields: string[], cb: (flag: string) => boolean) {
  return fields.filter(prop => fieldFilter(ctx, prop, cb))
}

/**
 * 字段是否有权限
 */
export function fieldFilter(ctx: TableCtx, prop: string, cb: (flag: string) => boolean) {
  let table = ctx.table
  if (table && !cb(table)) return false

  const nFields = findFieldPath(ctx, prop)
  for (let i = 0; i < nFields.length; i++) {
    if (nFields[i].relation) {
      table = nFields[i].relation!.table
    }
    else if (ctx.ctxs[table].map.id != nFields[i].prop) {
      const flag = `${table}.${nFields[i].prop}`
      if (!cb(flag)) return false
    }

    if (table && !cb(table)) return false
  }
  return true
}

/**
 * 遍历数据，cb 返回值时会停止遍历并将其返回
 */
export function dataWalker(ctx: TableCtx, data: any, cb: (ctx: TableCtx, field: NormalizedField) => any) {
  for (let k in data) {
    const field = ctx.keybyed[k]
    if (field.relation) {
      if (isArray(data[k])) {
        const arr = data[k]
        let ret: string
        for (let i = 0; i < arr.length; i++) {
          ret = cb(ctx, arr[i], permis)
          if (ret !== undefined) return ret

          const relCtx = ctx.ctxs[field.relation.table]
          dataWalker(relCtx, arrp[i], cb)
        }
      }
      else {
        return checkPermis(ctx.ctxs[field.relation.table], data[k])
      }
    }
    else {
      const ret = cb()
      if (ret !== undefined) return ret
    }
  }
}