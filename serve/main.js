import Koa from 'koa'
import Router from 'koa-router'
import cors from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import { PrismaClient } from '@prisma/client'

const app = new Koa()
const router = new Router({ prefix: '/prisma' })

const prisma = new PrismaClient()

router.post('/crud', async (ctx, next) => {
  const params = ctx.request.body
  const ret = await prisma[params.table.toLowerCase()][params.action](params.argv)
  ctx.body = ret
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
