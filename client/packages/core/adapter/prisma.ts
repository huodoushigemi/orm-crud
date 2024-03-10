import { isObject, isArray } from '@vue/shared'
import { merge, set } from 'lodash-es'
import { findFieldPath, isRelMany } from '../utils'
import { NormalizedField, TableCtx } from '../types'
import { IApiAdapter } from './interface'

export function updateInput(ctx: TableCtx, data) {
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

export function createInput(ctx: TableCtx, data) {
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

export function selectInput(ctx: TableCtx, paths: string[]) {
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
  }, { [ctx.map.id]: true } as any)
}

export function whereInput(ctx: TableCtx, data: any) {
  // 后序遍历
  function rrr(obj, ps1 = <string[]>[]) {
    const ret = {} as any
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

const lowerCase = s => s.replace(s[0], s[0].toLowerCase())

export function createPrismaAdapter(prisma): IApiAdapter {
  const _delegate = (table) => prisma[lowerCase(table)]
  
  return {
    async find(ctx, { where, select }) {
      select = select?.length ? select : [...ctx.columns, ...ctx.forms].map(e => e.prop)
      return await _delegate(ctx.table).findUnique({
        select: selectInput(ctx, select),
        // todo
        where: where,
      })
    },

    async finds(ctx, { where, select, skip, take, orderBy }) {
      select = select?.length ? select : ctx.columns.map(e => e.prop)
      return await _delegate(ctx.table).findMany({
        select: selectInput(ctx, select),
        where: whereInput(ctx, where),
        skip,
        take,
        orderBy
      })
    },

    async page(...args) {
      return {
        list: await this.finds(...args),
        total: await this.count(...args),
      }
    },

    async count(ctx, { where }) {
      return await _delegate(ctx.table).count({
        where: whereInput(ctx, where)
      })
    },

    async create(ctx, data) {
      return await _delegate(ctx.table).create({
        data: createInput(ctx, data)
      })
    },

    async update(ctx, data) {
      return await _delegate(ctx.table).update(
        updateInput(ctx, data)
      )
    },

    async remove(ctx, data) {
      return await _delegate(ctx.table).delete({
        where: {
          [ctx.map.id]: data[ctx.map.id]
        }
      })
    },

    async removes(ctx, data) {
      // todo
      return await _delegate(ctx.table).delete({
        where: {
          [ctx.map.id]: data[ctx.map.id]
        }
      })
    },
  }
}
