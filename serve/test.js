import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.create({
    data: {
      name: 'asd',
      age: 1,
      email: 'asdsvfv',
      posts: {
        set: [],
        connect: []
      },
      following: {
        // set: [],
        connect: []
      }
    }
  })
  // await prisma.post.create({
  //   data: {
  //     title: 'xxx',
  //     content: 'ssa',
  //   }
  // })
  // await prisma.video.update({
  //   data: {
  //     duration: 1,
  //     filename: 'xx' + new Date,
  //     size: 1,
  //     type: 'mp4',
  //     users: {
  //       // set: [],
  //       // delete: {  },
  //       disconnect: { id: 4 }
  //       // create: {
  //       //   user: {
  //       //     connect: { id: 1 }
  //       //   }
  //       // }
  //       // connect: [{ id: 2 }, { id: 3 }],
  //       // connect: {
  //       //   user: {
  //       //     id: 3
  //       //   }
  //       // }
  //       // update: { data: {  } }
  //       // connect: []
  //       // connect: {
  //       //   user: {
  //       //     id: 2
  //       //   }
  //       // }
  //       // create: {
  //       //   user: {
  //       //     // create: { name: 'user video', age: 1, email: 'xzvsd' }, // 创建
  //       //     // connect: { id: 2 } // 连接
  //       //   }
  //       // }
  //     }
  //   },
  //   where: {
  //     id: 2
  //   }
  // })
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
