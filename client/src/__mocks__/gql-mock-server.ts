import { ApolloServer, gql } from "apollo-server";
import { schema } from "./schema";
import fake from "casual";

const mockTypes = {
  User: () => ({
    firstName: fake.first_name,
    lastName: fake.last_name,
  }),
  Dataset: () => ({
    name: fake.title,
  }),
  Tag: () => ({
    name: fake.word,
  }),
  Program: () => ({
    name: "BBC News",
  }),
};

const server = new ApolloServer({
  typeDefs: schema,
  mocks: mockTypes,
  playground: true,
});

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
