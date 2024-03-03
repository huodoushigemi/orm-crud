import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // await prisma.user.create({
  //   data: {
  //     name: 'asd',
  //     age: 1,
  //     email: 'asdsvfv',
  //     posts: {
  //       create: {
          
  //       }
  //     }
  //   }
  // })

  await prisma.user.create({
    data: {
      posts: {
        create: []
      },
      videos: {
        connectOrCreate: {

        }
      }
    }
  })

  await prisma.user.update({
    data: {
      videos: {
        // connect: {}
        create: {
          
        },
        update: {

        }
      }
    }
  })
}

main()
