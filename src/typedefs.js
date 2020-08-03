const { gql } = require("apollo-server")
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
  # NOTE: To update card across list, compose the APIs provided below. Delete Card from previous list, add card to new list, update order in new list.
  # The Front-End will send the request to delete, request to add, and request to update if it detects a card has been transferred across a list.
  type Mutation {
    clearTable: String!
    addList(title: String!): List!
    addCard(content: String, list_id: Int): Card!

    updateList(list_id: Int!, title: String!): List
    updateCard(card_id: Int!, content: String!): Card

    deleteList(list_id: Int!): List!
    deleteCard(card_id: Int!): Card!

    updateListOrder(new_order: [Int]!): [List!]!
    updateCardOrderInList(list_id: Int, new_order: [Int]): [Card!]!
  }
`
module.exports = {
  typeDefs
}
