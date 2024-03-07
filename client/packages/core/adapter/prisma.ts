import { isObject, isArray } from '@vue/shared'
import { add, get, merge, set } from 'lodash-es'
import { objectPick } from '@vueuse/core'
import { extend } from 'umi-request'
import { findFieldPath, isRelMany } from '../utils'
import { NormalizedField, TableCtx } from '../types'
import { ApiAdapterInterface } from './interface'

const request = extend({
  prefix: 'http://localhost:3000/prisma'
})

function find(this: TableCtx, data, paths) {
  paths = paths?.length ? paths : [...this.columns, ...this.forms].map(e => e.prop)
  return {
    table: this.table,
    action: 'findUnique',
    argv: {
      select: { [this.map.id]: true, ...selectInput(this, paths) },
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
      select: { [this.map.id]: true, ...selectInput(this, paths) },
      where: whereInput(this, data),
      skip: extraQs.$pageSize ? (extraQs.$page - 1) * extraQs.$pageSize : undefined,
      take: extraQs.$pageSize
    }
  }
}

function create(this: TableCtx, data) {
  return {
    table: this.table,
    action: 'create',
    argv: { data: createInput(this, data) }
  }
}

function update(this: TableCtx, data) {
  return {
    table: this.table,
    action: 'update',
    argv: updateInput(this, data)
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
      where: whereInput(this, data)
    }
  }
}

function updateInput(ctx: TableCtx, data) {
  const $data = {}
  for (const k in data) {
    if (k.endsWith('-') || k.endsWith('+')) continue
    const rel = ctx.keybyed[k].relation
    const val = data[k]
    if (rel) {
      const _ctx = ctx.ctxs[rel.table]
      if (isRelMany(rel.rel)) {
        const update = [], create = [], connect = []
        data[`${k}+`].forEach(e => {
          if (e[rel.prop] == null) create.push(createInput(_ctx, e))
          else connect.push({ [_ctx.map.id]: e[_ctx.map.id] })
        })
        $data[k] = {
          create,
          update,
          connect,
          disconnect: !_ctx.middle ? data[`${k}-`]?.map(e => ({ [_ctx.map.id]: e[_ctx.map.id] })) : undefined,
          delete: _ctx.middle ? data[`${k}-`]?.map(e => ({ [_ctx.map.id]: e[_ctx.map.id] })) : undefined
        }
      } else {
        $data[k] = {
          update: val ? updateInput(_ctx, val) : undefined,
          connect: val ? { [_ctx.map.id]: val[_ctx.map.id] } : undefined,
          disconnect: !_ctx.middle && !val ? true: undefined,
          delete: _ctx.middle && !val ? true : undefined
        }
      }
    } else {
      $data[k] = data[k]
    }
  }
  $data[ctx.map.id] = undefined
  return {
    data: $data,
    where: {
      [ctx.map.id]: data[ctx.map.id]
    }
  }
}

function createInput(ctx: TableCtx, data) {
  const ret = {}
  for (let k in  data) {
    if (k.endsWith('-') || k.endsWith('+')) continue
    const rel = ctx.keybyed[k].relation
    const val = data[k]
    if (rel) {
      const { table, prop } = rel
      const _ctx = ctx.ctxs[table]
      if (val == null) {
        ret[k] = undefined
      }
      else if (!isObject(val)) {
        throw new Error(`Invalid prop: type check failed for prop ${k}. Expected Object, got ${val}`)
      }
      else {
        const _create = e => createInput(_ctx, e)
        const _connect = e => ({ [prop]: e[prop] })
        const adds = data[`${k}+`] || data[k]
        ret[k] = {
          create: isArray(adds) ? adds.filter(e => e[prop] == null).map(_create) : adds[prop] == null ? _create(adds) : undefined,
          connect: isArray(adds) ? adds.filter(e => e[prop] != null).map(_connect) : adds[prop] != null ? _connect(adds) : undefined
        }
      }
    } else {
      ret[k] = val
    }
  }
  return ret
}

function selectInput(ctx: TableCtx, paths: string[]) {
  return paths.reduce((o, path) => {
    const ps = findFieldPath(ctx, path)
    let ret = o
    ps.forEach((e, i) => {
      if (e.relation) {
        const { label, prop } = e.relation
        ret[e.prop] = { select: { [prop]: true } }
        ret = ret[e.prop].select
        merge(ret, selectInput(ctx.ctxs[e.relation.table], [label]))
      }
      else {
        ret[e.prop] = true
      }
    })
    return o
  }, {})
}

function whereInput(ctx: TableCtx, data: any) {
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
        else {
          if (isArray(val)) {
            ret.AND ||= []
            val.forEach((e, i) => {
              ret.AND[i] ||= {}
              const xxx = rrr(e, ps1)
              Object.values(xxx).some(e => e !== undefined) && set(ret.AND[i], ps2, xxx)
            })
          } else {
            const xxx = rrr(val, ps1)
            Object.values(xxx).some(e => e !== undefined) && set(ret, ps2, xxx)
          }
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