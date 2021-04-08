import { ApolloServer } from "apollo-server";
import { buildClientSchema } from "graphql";
import introspectedSchema from "../schema.json";
import fake from "casual";

fake.seed(123);

// Mocked users
const users = new Map([
  [
    "1",
    {
      id: "1",
      firstName: "Mary",
      lastName: "Apple",
    },
  ],
]);

// Mocked categories and values
const categoryData = [
  {
    id: "1",
    category: "gender",
    categoryValue: "men",
    count: 0,
  },
  { id: "2", category: "gender", categoryValue: "non-binary", count: 0 },
  { id: "3", category: "gender", categoryValue: "women", count: 5 },
  {
    id: "4",
    category: "gender",
    categoryValue: "gender non-conforming",
    count: 0,
  },
  { id: "5", category: "gender", categoryValue: "cisgender", count: 0 },
  { id: "6", category: "gender", categoryValue: "transgender", count: 0 },
];

// Mocked records
const recordsData = [
  {
    id: "05caae8d-bb1a-416e-9dda-bb251fe474ff",
    publicationDate: "12/20/2020",
    data: categoryData,
  },
  {
    id: "f11f6472-647f-468e-837a-1cdfa78f9cde",
    publicationDate: "12/21/2020",
    data: categoryData,
  },
];

// Mocked datasets
const datasets = new Map([
  [
    "5a8ee1d5-2b5a-49db-b466-68fe50a27cdb",
    {
      id: "5a8ee1d5-2b5a-49db-b466-68fe50a27cdb",
      name: "Breakfast Hour",
      records: recordsData,
    },
  ],
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
  Record: () => ({
    data: recordsData,
  }),
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
