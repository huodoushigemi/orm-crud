import { isObject, isArray } from '@vue/shared'
import { get, set } from 'lodash-es'
import { objectPick } from '@vueuse/core'
import { extend } from 'umi-request'
import { findFieldPath, isRelMany } from '../../utils'
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
      data: buildData(this, data, true),
    }
  }
}

function update(this: TableCtx, data) {
  return {
    table: this.table,
    action: 'update',
    argv: {
      data: {
        ...buildData(this, data, false),
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

function updateInput(ctx: TableCtx, data) {
  const $data = {}
  for (const k in data) {
    if (k.endsWith('-') || k.endsWith('+')) continue
    const rel = ctx.keybyed[k].relation
    const val = data[k]
    if (rel) {
      const _ctx = ctx.ctxs[rel.table]
      if (isRelMany(rel.rel)) {
        $data[k] = {
          update: val.map(e => updateInput(_ctx, e)),
          connect: data[`${k}+`]?.map(e => ({ [_ctx.map.id]: e[_ctx.map.id] })),
          disconnect: data[`${k}-`]?.map(e => ({ [_ctx.map.id]: e[_ctx.map.id] })),
        }
      } else {
        $data[k] = {
          update: val ? updateInput(_ctx, val) : undefined,
          connect: val ? { [_ctx.map.id]: val[_ctx.map.id] } : undefined,
          disconnect: val ? undefined : true
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
  const input = updateInput(ctx, data)
  input.where = undefined
  return input
}

function buildData(ctx: TableCtx, data, create: boolean) {
  const ret = {}
  for (let k in  data) {
    const field = findFieldPath(ctx, k).slice(-1)[0]
    const rel = field.relation

    const val = data[k]
    if (rel) {
      if (val == null) {
        ret[k] = create ? undefined : { disconnect: true }
      }
      else if (!isObject(val)) {
        throw new Error(`Invalid prop: type check failed for prop ${k}. Expected Object, got ${val}`)
      }
      else {
        const fn = v => ({ [rel.prop]: v[rel.prop] })
        ret[k] = {
          set: !create && isRelMany(rel.rel) ? [] : undefined,
          connect: isArray(val) ? val.map(fn) : fn(val)
        }
      }
    } else {
      ret[k] = val
    }
  }
  return ret
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