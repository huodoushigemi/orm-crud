import { get, set } from 'lodash-es'
import { isObject, objectPick, useArrayFilter } from '@vueuse/core'
import { isPlainObject } from '@vue/shared'
import { extend } from 'umi-request'
import { findFieldPath } from '../../utils'
import { NormalizedField } from '../../props'
import { ApiAdapterInterface } from './interface'
import { TableCtx } from '..'

const request = extend({
  prefix: 'http://localhost:3000/prisma'
})

function find(this: TableCtx, data, paths) {
  paths = paths?.length ? paths : [...this.columns, ...this.forms].map(e => e.prop)
  return {
    table: this.table,
    action: 'findUnique',
    argv: {
      select: { [this.map.id]: true, ...select(this, paths) },
      where: data,
    }
  }
}

function finds(this: TableCtx, data, paths) {
  const extraQueryKs = Object.keys(data).filter(k => !this.searchs.find(e => e.prop.split('.')[0] == k))
  const extraQs = objectPick(data, extraQueryKs as any)
  paths = paths?.length ? paths : this.columns.map(e => e.prop)
  return {
    table: this.table,
    action: 'findMany',
    argv: {
      select: { [this.map.id]: true, ...select(this, paths) },
      where: where(this, data),
      skip: extraQs.$pageSize ? (extraQs.$page - 1) * extraQs.$pageSize : undefined,
      take: extraQs.$pageSize
    }
  }
}

function create(this: TableCtx, data) {
  return {
    table: this.table,
    action: 'create',
    argv: {
      data: {
        ...this.forms.reduce((o, e) => {
          const rel = e.relation, val = data[e.prop]
          if (rel) {
            const fn = v => ({ [rel.prop]: v[rel.prop] })
            o[e.prop] = {
              connect: val ? Array.isArray(val) ? val.map(fn) : fn(val) : undefined
            }
          } else {
            o[e.prop] = val
          }
          return o
        }, {})
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
        ...this.forms.reduce((o, e) => {
          const rel = e.relation, val = data[e.prop]
          if (rel) {
            const fn = v => ({ [rel.prop]: v[rel.prop] })
            o[e.prop] = {
              set: rel.rel == '1-n' || rel.rel == 'm-n' ? [] : undefined,
              connect: val ? Array.isArray(val) ? val.map(fn) : fn(val) : undefined
            }
          } else {
            o[e.prop] = val
          }
          return o
        }, {}),
        [this.map.id]: undefined
      },
      where: { [this.map.id]: data[this.map.id] }
    }
  }
}

function remove(this: TableCtx, data) {
  return {
    table: this.table,
    action: 'delete',
    argv: {
      where: { [this.map.id]: data[this.map.id] }
    }
  }
}

function removes(this: TableCtx, data) {
  return {
    table: this.table,
    action: 'delete',
    argv: {
      where: {
        [this.map.id]: { in: data.map(e => e[this.map.id]) }
      }
    }
  }
}

function count(this: TableCtx, data) {
  return {
    table: this.table,
    action: 'count',
    argv: {
      where: where(this, data)
    }
  }
}


function select(ctx: TableCtx, paths: string[]) {
  return paths.reduce((o, path) => {
    const ps = findFieldPath(ctx, path)
    if (ps[ps.length - 1].relation) {
      // e.g: post.author -> post.select.author.select
      const rel = ps[ps.length - 1].relation!
      const ks = path.replace(/\./g, '.select.') + '.select'
      const val = get(o, ks), newVal = { [rel.label]: true, [rel.prop]: true }
      val ? Object.assign(val, newVal) : set(o, ks, newVal)
    } else if (ps.length > 1) {
      // e.g: post.author.name -> post.select.author.select.name
      set(o, path.replace(/\./g, '.select.'), true)
    } else {
      // e.g: content
      set(o, path, true)
    }
    return o
  }, {})
}

function where(ctx: TableCtx, data: any) {
  // 后序遍历
  function rrr(obj, ps1 = <string[]>[]) {
    const ret = {}
    for (let k in obj) {
      if (k[0] == '$') continue
      ps1.push(k)
      const field = findFieldPath(ctx, ps1).slice(-1)[0]
      const rel = field.relation?.rel
      
      const ps2 = <string[]>[]
      ps2.push(k)
      if (rel == '1-n' || rel == 'm-n') ps2.push('some')
      else if (field.filter) ps2.push(field.filter)

      const val = obj[k]
      if (rel) {
        if (val == null) {
          ret[k] = undefined
        }
        else if (!isObject(val)) {
          throw new Error(`Invalid prop: type check failed for prop ${ps1.join('.')}. Expected Object, got ${val}`)
        }
        else  {
          const xxx = rrr(val, ps1)
          Object.values(xxx).some(e => e === undefined)
            ? ret[k] = undefined
            : set(ret, ps2, xxx)
        }
      }
      else if (val === '' || val === undefined) {
        ret[k] = undefined
      }
      else {
        set(ret, ps2, val)
      }
      
      ps1.pop()
    }
    return ret
  }
  return rrr(data)
}

const api = { find, finds, create, update, remove, removes, count }

export const prismaAdapter = Object.keys(api).reduce((o, e) => {
  o[e] = function (...args) {
    return request.post('/crud', { data: api[e].apply(this, args) })
  }
  return o
}, {}) as ApiAdapterInterface

prismaAdapter.page = async function(...args) {
  const [list, total] = await request.post('/crud', { data: [finds.apply(this, args), count.apply(this, args)] })
  return { list, total, a: 1 }
}