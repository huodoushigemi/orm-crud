import Koa from 'koa'
import Router from 'koa-router'
import cors from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import { PrismaClient } from '@prisma/client'

const app = new Koa()
const router = new Router({ prefix: '/prisma' })

const prisma = new PrismaClient()

router.post('/crud', async (ctx, next) => {
  prisma.post.findUnique
  const data = ctx.request.body
  if (Array.isArray(data)) {
    const ps = data.map(data => prisma[data.table.toLowerCase()][data.action](data.argv))
    ctx.body = await prisma.$transaction(ps)
    return 
  } else {
    const ret = await prisma[data.table.toLowerCase()][data.action](data.argv)
    ctx.body = ret
  }
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
