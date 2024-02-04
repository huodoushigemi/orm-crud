import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // ... you will write your Prisma Client queries here
  prisma.user.fields
  const a = await prisma.post.findUnique({
    where: { id: 4 },
    // select: {
    //   sponsor: { select: { post: { select: { author: true } } } },
    // }
    // include: {
    //   sponsor: {
    //     include: { post: true }
    //   }
    // },
  })
  prisma.post.deleteMany({
    where: {
      
    }
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })