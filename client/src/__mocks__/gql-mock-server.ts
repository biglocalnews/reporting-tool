import { ApolloServer } from "apollo-server";
import { buildClientSchema } from "graphql";
import introspectedSchema from "../schema.json";
import fake from "casual";

fake.seed(123);

const mockTypes = {
  User: () => ({
    id: 1,
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
  Date: () => {
    return fake.date()
  }
};

const server = new ApolloServer({
  schema: buildClientSchema(introspectedSchema as any),
  mocks: mockTypes,
  playground: true,
});

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
