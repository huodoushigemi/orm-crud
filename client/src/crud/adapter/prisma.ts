import { get, set } from 'lodash-es'
import { objectPick } from '@vueuse/core'
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
    action: 'find',
    argv: {
      select: { [this.map.id]: true, ...select(this, this.columns) },
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

function count(this: TableCtx, data) {
  return {
    table: this.table,
    action: 'count',
    argv: {
      where: where(this, data)
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


function select(ctx: TableCtx, fields: NormalizedField[]) {
  return fields.reduce((o, e) => {
    const ps = findFieldPath(ctx, e.prop)
    if (ps[ps.length - 1].relation) {
      // e.g: post | post.author
      set(o, e.prop.replace(/\./, '.select.') + '.select', { [e.relation!.label]: true, [e.relation!.prop]: true })
    } else if (ps.length > 1) {
      // e.g: post.title | post.user.name
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