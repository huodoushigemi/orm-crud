import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.post.update({
    data: {
      title: 'xxx',
      author: {
        connect: {

        }
      }
    }
  })

  // await prisma.user.update({
  //   data: {
  //     posts: {
  //       set: []
  //     }
  //   },
  //   where: {
  //     id: 1
  //   }
  // })
}

main()
