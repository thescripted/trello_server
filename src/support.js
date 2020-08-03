async function getListCount(prisma) {
  const count = await prisma.list.count()
  return count
}

async function getCardCountInList(prisma, list_id) {
  const count = await prisma.card.count({
    where: {
      list_id: list_id
    }
  })
  return count
}

async function updateListOrderAfterDelete(prisma, deletedList) {
  const count = await getListCount(prisma) // Count how many lists exists
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

async function updateCardOrderAfterDelete(prisma, deletedCard) {
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

module.exports = {
  getListCount,
  getCardCountInList,
  updateListOrderAfterDelete,
  updateCardOrderAfterDelete
}
