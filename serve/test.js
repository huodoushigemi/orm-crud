import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const aaa = await prisma.user.findUnique({
    select: {
      id: true,
      posts: {
        select: {
          tag: {
            select: {
              post: {
                select: {
                  content: true,
                },
              },
            },
          },
        },
      },
    },
    where: {
      id: 2,
    },
  })

  console.log(aaa)
}

main()
