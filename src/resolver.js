const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const {
  getListCount,
  getCardCountInList,
  updateListOrderAfterDelete,
  updateCardOrderAfterDelete
} = require('./support');

const Query = {
  info: () => 'Oh my fucking god this is working!',
  getSingleCard: async (_, args) =>
    await prisma.card.findOne({
      where: { card_id: args.card_id },
      include: { List: true }
    }),

  getAllCards: async () =>
    await prisma.card.findMany({
      include: { List: true },
      orderBy: { card_order: 'asc' }
    }),

  getSingleList: async (_, args) =>
    await prisma.list.findOne({
      where: { list_id: args.list_id },
      include: { Card: { orderBy: { card_order: 'asc' } } }
    }),

  getAllLists: async () =>
    await prisma.list.findMany({
      include: { Card: { orderBy: { card_order: 'asc' } } },
      orderBy: { list_order: 'asc' }
    })
};
const Mutation = {
  clearTable: async () => {
    await prisma.list.deleteMany();
    return 'deleted';
  },

  addList: async (_, args) => {
    const listCount = await getListCount(prisma);
    const response = await prisma.list.create({
      data: {
        title: args.title,
        list_order: listCount + 1
      }
    });
    console.log(response);
    return response;
  },

  addCard: async (_, args) => {
    const cardCount = await getCardCountInList(prisma, args.list_id);
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
    });
  },

  updateList: async (_, args) => {
    const updated = await prisma.list.update({
      where: {
        list_id: args.list_id
      },
      data: {
        title: args.title
      },
      include: { Card: { orderBy: { card_order: 'asc' } } }
    });
    return updated;
  },

  updateCard: async (_, args) => {
    const updated = await prisma.card.update({
      where: {
        card_id: args.card_id
      },
      data: {
        content: args.content
      }
    });
    return updated;
  },

  deleteList: async (_, args) => {
    const deleted = await prisma.list.delete({
      where: {
        list_id: args.list_id
      }
    });
    await updateListOrderAfterDelete(prisma, deleted); // Updates Rest of the List Order after list is deleted.
    return deleted;
  },

  deleteCard: async (_, args) => {
    const deleted = await prisma.card.delete({
      where: {
        card_id: args.card_id
      }
    });
    await updateCardOrderAfterDelete(prisma, deleted); // Updates the deleted card order list after deletion
    return deleted;
  },

  updateListOrder: async (_, args) => {
    // Finds all lists
    const listCollection = await prisma.list.findMany({
      orderBy: {
        // Orders them numerically
        list_order: 'asc'
      }
    });

    const updatedList = listCollection.map(async (listItem, index) => {
      // Array of Promises.
      const ListItemToUpdate = await prisma.list.update({
        where: {
          list_id: listItem.list_id
        },
        data: {
          list_order: args.new_order[index]
        }
      });
      return ListItemToUpdate;
    });

    return await Promise.all(updatedList);
  },

  updateCardOrderInList: async (_, args) => {
    const cardCollection = await prisma.card.findMany({
      // Select All Card in Correct List
      where: {
        list_id: args.list_id
      },
      orderBy: {
        card_order: 'asc'
      }
    });
    const updatedCard = cardCollection.map(async (cardItem, index) => {
      const cardItemToUpdate = await prisma.card.update({
        where: {
          card_id: cardItem.card_id
        },
        data: {
          card_order: args.new_order[index]
        }
      });
      return cardItemToUpdate;
    });

    return await Promise.all(updatedCard); // Wait for array to resolve, return.
  }
};

const resolvers = {
  Query,
  Mutation
};

module.exports = {
  resolvers,
  prisma
};
