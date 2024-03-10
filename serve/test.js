import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

import tables from '../client/src/tables'
import { createCtxs } from '../client/packages/core'
import { createPrismaAdapter } from '../client/packages/core/adapter/prisma'

const ctxs = createCtxs(tables)
const api = createPrismaAdapter(prisma)

async function main() {
  // const aaa = await prisma.user.findMany({
  //   where: {
  //     AND: [{
  //       videos: { some: { video: { id: 1 } } },
  //     }, {
  //       videos: { some: { video: { id: 2 } } },
  //     }, {

  //     }]
  //   }
  // })

  console.log('aaaaaaaaaaaaaaa');
  console.log(
    await api.find(ctxs.User, {
      id: 1
    }),
    await api.finds(ctxs.User, {
      videos: [
        { video: { id: 1 } },
        { video: { id: 2 } },
      ]
    })
  )
}

main()
