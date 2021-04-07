import { ApolloServer } from "apollo-server";
import { buildClientSchema } from "graphql";
import introspectedSchema from "../schema.json";
import fake from "casual";

fake.seed(123);


// Mocked users
const users = new Map([
  ["1", {
    id: "1",
    firstName: "Mary",
    lastName: "Apple",
  }],
]);

// Mocked datasets
const datasets = new Map([
  ["5a8ee1d5-2b5a-49db-b466-68fe50a27cdb", {
    id: "5a8ee1d5-2b5a-49db-b466-68fe50a27cdb",
    name: "BBC News Dataset",
  }],
]);


const mockTypes = {
  Team: () => ({
    programs: () => [{}],
  }),
  User: () => ({
    firstName: fake.first_name,
    lastName: fake.last_name,
    teams: () => [{}],
  }),
  Query: () => ({
    //@ts-ignore
    dataset: (parent, args, ctx, info) => datasets.get(args.id) || {},
    //@ts-ignore
    user: (parent, args, ctx, info) => users.get(args.id) || {},
  }),
  Tag: () => ({
    name: fake.word,
  }),
  Program: () => ({
    id: "25c140cc-6cd0-4bd3-8230-35b56e59481a",
    name: "BBC News",
    datasets: Array.from(datasets.values()),
  }),
  Date: () => {
    return fake.date();
  },
};

const server = new ApolloServer({
  // NOTE: "any" is used to bypass a type compatibility issue with the downloaded schema
  // and the buildClientSchema function that should be resolved in the future.
  // See here: https://github.com/apollographql/apollo-tooling/issues/1491
  schema: buildClientSchema(introspectedSchema as any),
  mocks: mockTypes,
  playground: true,
});

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
