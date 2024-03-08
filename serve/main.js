import Koa from 'koa'
import Router from 'koa-router'
import cors from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import { PrismaClient } from '@prisma/client'

const app = new Koa()
const router = new Router({ prefix: '/prisma' })

const prisma = new PrismaClient()

import tables from '../client/src/tables'
import { createCtxs } from '../client/packages/core'
import { createPrismaAdapter } from '../client/packages/core/adapter/prisma'

const ctxs = createCtxs(tables)
const api = createPrismaAdapter(prisma)

const lowerCase = s => s.replace(s[0], s[0].toLowerCase())

router.post('/crud', async (ctx, next) => {
  const data = ctx.request.body
  
  if (Array.isArray(data)) {
    const ps = data.map(data => prisma[lowerCase(data.table)][data.action](data.argv))
    ctx.body = await prisma.$transaction(ps)
    return 
  } else {
    const ret = await prisma[lowerCase(data.table)][data.action](data.argv)
    ctx.body = ret
  }
})

router.post('/find/:table', async (ctx, next) => {
  const { table } = ctx.params
  const data = ctx.request.body
  ctx.body = await api.find(ctxs[table], data.where, data.fields)
})

router.post('/finds/:table', async (ctx, next) => {
  const { table } = ctx.params
  const data = ctx.request.body
  ctx.body = await api.finds(ctxs[table], data.where, data.fields)
})

router.post('/page/:table', async (ctx, next) => {
  const { table } = ctx.params
  ctx.body = await api.page(ctxs[table], ctx.request.body)
})

router.post('/create/:table', async (ctx, next) => {
  const { table } = ctx.params
  ctx.body = await api.create(ctxs[table], ctx.request.body)
})

router.post('/update/:table', async (ctx, next) => {
  const { table } = ctx.params
  ctx.body = await api.update(ctxs[table], ctx.request.body)
})

router.post('/remove/:table', async (ctx, next) => {
  const { table } = ctx.params
  ctx.body = await api.remove(ctxs[table], ctx.request.body)
})

router.post('/removes/:table', async (ctx, next) => {
  const { table } = ctx.params
  ctx.body = await api.removes(ctxs[table], ctx.request.body)
})

router.post('/count/:table', async (ctx, next) => {
  const { table } = ctx.params
  ctx.body = await api.count(ctxs[table], ctx.request.body)
})


async function handlerErr(ctx, next) {
  try {
    await next()
  } catch (err) {
    ctx.app.emit('err', err)
    ctx.status = err.status || 500
    ctx.body = err.msg || err.message
  }
}

app
  .use(cors())
  .use(bodyParser())
  .use(handlerErr)
  .use(router.routes())
  // .use(router.allowedMethods())

app.on('err', (err) => {
  console.error(err)
})

app.listen(3000, () => {
  console.log('\nhttp://localhost:3000/prisma')
})
