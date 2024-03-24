import Koa from 'koa'
import Router from 'koa-router'
import cors from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import { PrismaClient } from '@prisma/client'

const app = new Koa()
const router = new Router({ prefix: '/prisma' })

const prisma = new PrismaClient()

import tables from '../client/src/tables'
import { FindOpt, createCtxs } from '../client/packages/core'
import { createPrismaAdapter } from '../client/packages/core/adapter/prisma'
import { checkDataPermis, fieldFilter, fieldsFilter } from '../client/packages/core/utils'
import { RWPermis } from '../client/packages/ep/RWPermis'

const rwMap = {
  'User': 4,
  'User.name': 6,
  'User.age': 4,
}

const rwPermis = RWPermis(rwMap)

const ctxs = createCtxs(tables)
const api = createPrismaAdapter(prisma)

router.post('/find/:table', async (ctx) => {
  await handlerRPermis(ctx)
  const { table } = ctx.params
  ctx.body = await api.find(ctxs[table], ctx.request.body)
})

router.post('/finds/:table', async (ctx) => {
  await handlerRPermis(ctx)
  const { table } = ctx.params
  ctx.body = await api.finds(ctxs[table], ctx.request.body)
})

router.post('/page/:table', async (ctx) => {
  await handlerRPermis(ctx)
  const { table } = ctx.params
  ctx.body = await api.page(ctxs[table], ctx.request.body)
})

router.post('/count/:table', async (ctx) => {
  const { table } = ctx.params
  ctx.body = await api.count(ctxs[table], ctx.request.body)
})

router.post('/create/:table', async (ctx) => {
  const { table } = ctx.params
  ctx.body = await api.create(ctxs[table], ctx.request.body)
})

router.post('/update/:table', async (ctx) => {
  const { table } = ctx.params
  ctx.body = await api.update(ctxs[table], ctx.request.body)
})

router.post('/remove/:table', async (ctx) => {
  const { table } = ctx.params
  ctx.body = await api.remove(ctxs[table], ctx.request.body)
})

router.post('/removes/:table', async (ctx) => {
  const { table } = ctx.params
  ctx.body = await api.removes(ctxs[table], ctx.request.body)
})


// 处理错误
async function handlerErr(ctx, next) {
  try {
    await next()
  } catch (err) {
    ctx.app.emit('err', err)
    ctx.status = err.status || 500
    ctx.body = err.message
  }
}


// 处理读权限
async function handlerRPermis(ctx: Koa.Context) {
  return
  const { table } = ctx.params
  const data = ctx.request.body as FindOpt
  const { where } = data
  if (data.select) {
    const flag = data.select.find(e => !fieldFilter(ctxs[table], e, rwPermis.r))
    if (flag) throw new Error(`无权限的标识 ${flag}`)
  } else {
    data.select = Object.keys(rwMap).filter(e => e.startsWith(`${table}.`) && rwPermis.r(e)).map(e => e.replace(`${table}.`, ''))
  }

  const flag = checkDataPermis(ctxs[table], where, rwPermis.r)
  if (flag) throw new Error(`无权限的标识 ${flag}`)
}


// 处理写权限
async function handlerWPermis(ctx: Koa.Context) {
  const { table } = ctx.params
  const data: any = ctx.request.body
  const flag = checkDataPermis(ctxs[table], data, rwPermis.w)
  if (flag) throw new Error(`无权限的标识 ${flag}`)
}


// 处理操作日志
async function handlerLog(ctx: Koa.Context, next) {
  if (!['create', 'update', 'remove', 'removes'].find(e => ctx.url.startsWith('/prisma/' + e))) return next()
  const [, , action, table] = ctx.url.split('/')
  const st = new Date
  let EXEC_STATUS = 1
  try {
    await next()
  } catch(e) {
    EXEC_STATUS = 0
    throw e
  } finally {
    await prisma.gfdc_auth_sys_operation_log.create({
      data: {
        REMOTE_ADDR: ctx.request.ip,
        REQUEST_PARAMS: JSON.stringify(ctx.request.body),
        MODULE_NAME: table,
        REQUEST_TYPE: 'POST',
        RUNTIME: +new Date - +st,
        REQUEST_URI: ctx.url,
        EXEC_STATUS,
        CREATE_TIME: st,
        OPERATION_DESC: action
      }
    })
  }
}

app
  .use(cors())
  .use(bodyParser())
  .use(handlerErr)
  // .use(handlerLog)
  .use(router.routes())
  // .use(router.allowedMethods())

app.on('err', (err) => {
  console.error(err)
})

app.listen(3000, () => {
  // console.log('\nhttp://0.0.0.0:3000/prisma')
  console.log('success')
})
