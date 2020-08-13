const { ApolloServer } = require('apollo-server-lambda');
const { resolvers } = require('./src/resolver');
const { typeDefs } = require('./src/typedefs');

const server = new ApolloServer({
  typeDefs,
  resolvers
});
exports.graphqlHandler = server.createHandler({
  cors: {
    origin: '*',
    credentials: true
  }
});
