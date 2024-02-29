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

  await prisma.user_Video.update({
    data: {
      video: {
        
      }
    }
  })
}

main()
