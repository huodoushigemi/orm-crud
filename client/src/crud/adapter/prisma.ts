import { get, set } from 'lodash-es'
import { objectPick, useArrayFilter } from '@vueuse/core'
import { isPlainObject } from '@vue/shared'
import { extend } from 'umi-request'
import { TableCtx, findFieldPath } from '../../utils'
import { NormalizedField } from '../../props'
import { ApiAdapterInterface } from './interface'

const request = extend({
  prefix: 'http://localhost:3000/prisma'
})

function find(this: TableCtx, data) {
  return {
    table: this.table,
    action: 'findUnique',
    argv: {
      select: { [this.map.id]: true, ...select(this, [...this.columns, ...this.forms]) },
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
      select: { [this.map.id]: true, ...select(this, this.columns) },
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
        ...data,
        ...this.forms.filter(e => e.relation).reduce((o, e) => {
          const val = data[e.prop]
          const fn = v => ({ [e.relation!.prop]: v[e.relation!.prop] })
          o[e.prop] = {
            connect: val ? Array.isArray(val) ? val.map(fn) : fn(val) : undefined
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
        ...data,
        ...this.forms.filter(e => e.relation).reduce((o, e) => {
          const val = data[e.prop]
          const fn = v => ({ [e.relation!.prop]: v[e.relation!.prop] })
          o[e.prop] = {
            set: e.relation!.rel == '1-n' || e.relation!.rel == 'm-n' ? [] : undefined,
            connect: val ? Array.isArray(val) ? val.map(fn) : fn(val) : undefined
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


function select(ctx: TableCtx, fields: NormalizedField[]) {
  return fields.reduce((o, e) => {
    const ps = findFieldPath(ctx, e.prop)
    if (ps[ps.length - 1].relation) {
      // e.g: post.author -> post.select.author.select
      const prop = e.prop.replace(/\./, '.select.') + '.select'
      const val = get(o, prop), newVal = { [e.relation!.label]: true, [e.relation!.prop]: true }
      val ? Object.assign(val, newVal) : set(o, prop, newVal)
    } else if (ps.length > 1) {
      // e.g: post.author.name -> post.select.author.select.name
      set(o, e.prop.replace(/\./, '.select.'), true)
    } else {
      // e.g: content
      set(o, e.prop, true)
    }
    return o
  }, {})
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
          if (e.filter) path[path.length - 1] = field.filter
          else path.push(field.filter)
        }
      }
    })
    const val = get(data, field.prop)
    if (val != null) set(ret, path.join('.'), val)
  })

  return ret
}

const api = { find, finds, create, update, remove, removes, count }

export const prismaAdapter = Object.keys(api).reduce((o, e) => {
  o[e] = function (data) {
    return request.post('/crud', { data: api[e].call(this, data) })
  }
  return o
}, {}) as ApiAdapterInterface

prismaAdapter.page = async function(data) {
  const [list, total] = await request.post('/crud', { data: [finds.call(this, data), count.call(this, data)] })
  return { list, total, a: 1 }
}