import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const aaa = await prisma.user.findMany({
    where: {
      AND: [{
        videos: { some: { video: { id: 1 } } },
      }, {
        videos: { some: { video: { id: 2 } } },
      }, {

      }]
    }
  })

  console.log(aaa);
}

main()
