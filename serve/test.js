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

  await prisma.post.update({
    data: {
      author: {
        // delete
        disconnect
      },
      comments: {
        delete: []
      }
    }
  })

  await prisma.user.update({
    data: {
      posts: {
      }
      videos: {
        create: {
          
        },
        update: {

        }
      }
    }
  })
}

main()
