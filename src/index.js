const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function Main() {
  await prisma.list.create({
    data: {
      list_order: 2,
      title: "Howdy"
    }
  })

  for (let i = 10; i < 20; i++) {
    await prisma.card.create({
      data: {
        content: `This is Card #${i}`,
        List: {
          connect: {
            list_id: 2
          }
        },
        card_order: i
      }
    })
  }

  const list = await prisma.list.findOne({
    where: {
      list_id: 2
    },
    include: {
      Card: true
    }
  })

  console.log(list)
}

try {
  Main()
} finally {
  prisma.disconnect()
}
