const { ApolloServer, gql } = require("apollo-server")
const { PrismaClient } = require("@prisma/client")

async function getListCount() {
  const count = await prisma.list.count()
  return count
}

async function getCardCountInList(list_id) {
  const count = await prisma.card.count({
    where: {
      list_id: list_id
    }
  })
  return count
}

async function updateListOrderAfterDelete(deletedList) {
  const count = await getListCount() // Count how many lists exists
  console.log(count)

  if (count <= 0 || deletedList.list_order === count + 1) {
    return
  }

  const listCollection = await prisma.list.findMany() // Grab all the lists

  listCollection.map(async listItem => {
    if (listItem.list_order > deletedList.list_order) {
      // Determine if the list is above the order #
      await prisma.list.update({
        where: {
          list_id: listItem.list_id
        },
        data: {
          list_order: listItem.list_order - 1 // If it is, subtract one.
        }
      })
    }
  })
}

async function updateCardOrderAfterDelete(deletedCard) {
  const count = await getCardCountInList(deletedCard.list_id) // count # of cards in list

  // If our card is the last card or if there is only one card in the list, return.
  if (count <= 0 || deletedCard.card_order === count + 1) {
    return
  }

  const cardCollection = await prisma.card.findMany({
    // Collection of cards in deleted list
    where: {
      list_id: deletedCard.list_id
    }
  })

  cardCollection.map(async cardItem => {
    if (cardItem.card_order > deletedCard.card_order) {
      await prisma.card.update({
        where: {
          card_id: cardItem.card_id
        },
        data: {
          card_order: cardItem.card_order - 1
        }
      })
    }
  })
}

const prisma = new PrismaClient({
  log: ["query"]
})

const typeDefs = gql`
  # Type Definition for Trello Project. These contain all the fields that can be queried/mutated by our Client,
  # a.k.a. this is the structure for the "API" that our client can call on and use in the front-end.
  # Two Types. Lists and Cards.
  #
  # List Includes: List ID, Title, Order, Created At, Array of Cards
  # Card Includes: Card ID, Title, List Foreign Key ID, Order, Created At

  type List {
    list_id: Int!
    title: String!
    list_order: Int!
    created_at: String!
    Card: [Card]!
  }

  type Card {
    card_id: Int!
    list_id: Int!
    List: List
    content: String!
    card_order: Int!
    created_at: String!
  }

  # Queries: These are all the available queries that can be executed by the client.
  type Query {
    getAllCards: [Card]!
    getSingleCard(card_id: Int): Card!
    getAllLists(take: Int): [List]!
    getSingleList(list_id: Int): List!
    info: String!
  }

  # All Available write operations to Database. Update/Delete Titles, Update/Delete Cards. Update Order of Cards In List or Across List.
  type Mutation {
    clearTable: String!
    addList(title: String!): List!
    addCard(content: String, list_id: Int): Card!

    updateList(list_id: Int!, title: String!): List
    updateCard(card_id: Int!, content: String!): Card

    deleteList(list_id: Int!): List!
    deleteCard(card_id: Int!): Card!

    updateListOrder(new_order: [Int]!): [List!]!
    updateCardOrderInList(list_id: Int, new_order: [Int]): List!
    updateCardOrderAcrossList(
      list_id_tuple: [Int!]!
      new_order_tuple: [[Int]]
    ): [List!]!
  }
`
const resolvers = {
  Query: {
    info: () => "info",
    getSingleCard: async (_, args) =>
      await prisma.card.findOne({
        where: { card_id: args.card_id },
        include: { List: true }
      }),
    getAllCards: async () =>
      await prisma.card.findMany({
        include: { List: true },
        orderBy: { card_order: "asc" }
      }),
    getSingleList: async (_, args) =>
      await prisma.list.findOne({
        where: { list_id: args.list_id },
        include: { Card: { orderBy: { card_order: "asc" } } }
      }),
    getAllLists: async () =>
      await prisma.list.findMany({
        include: { Card: { orderBy: { card_order: "asc" } } },
        orderBy: { list_order: "asc" }
      })
  },

  Mutation: {
    clearTable: async () => {
      await prisma.list.deleteMany()
      return "deleted"
    },

    addList: async (_, args) => {
      const listCount = await getListCount()
      const response = await prisma.list.create({
        data: {
          title: args.title,
          list_order: listCount + 1
        }
      })
      console.log(response)
      return response
    },

    addCard: async (_, args) => {
      const cardCount = await getCardCountInList(args.list_id)
      return await prisma.card.create({
        data: {
          content: args.content,
          card_order: cardCount + 1,
          List: {
            connect: {
              list_id: args.list_id
            }
          }
        }
      })
    },

    updateList: async (_, args) => {
      const updated = await prisma.list.update({
        where: {
          list_id: args.list_id
        },
        data: {
          title: args.title
        },
        include: { Card: { orderBy: { card_order: "asc" } } }
      })
      return updated
    },

    updateCard: async (_, args) => {
      const updated = await prisma.card.update({
        where: {
          card_id: args.card_id
        },
        data: {
          content: args.content
        }
      })
      return updated
    },

    deleteList: async (_, args) => {
      const deleted = await prisma.list.delete({
        where: {
          list_id: args.list_id
        }
      })
      await updateListOrderAfterDelete(deleted) // Updates Rest of the List Order after list is deleted.
      return deleted
    },

    deleteCard: async (_, args) => {
      const deleted = await prisma.card.delete({
        where: {
          card_id: args.card_id
        }
      })
      await updateCardOrderAfterDelete(deleted) // Updates the deleted card order list after deletion
      return deleted
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
