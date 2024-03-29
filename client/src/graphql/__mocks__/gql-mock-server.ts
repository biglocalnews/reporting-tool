import { ApolloServer, UserInputError } from "apollo-server";
import fake from "casual";
import { buildClientSchema } from "graphql";
import introspectedSchema from "../../schema.json";

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
    publicationDate: "2020-12-20",
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    dataset: (parent, args) => datasets.get(args.id) || {},
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    user: (parent, args) => users.get(args.id) || {},
  }),
  Mutation: () => ({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    upsertRecord: (parent, args) => {
      args.input.id = fake.uuid;
      args.input.data.forEach((element: { id: string }) => {
        element.id = fake.uuid;
      });
      recordsData.push(args.input);
      return {
        record: {
          id: args.input.id,
        },
      };
    },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    deleteRecord: (parent, args) => {
      const recordToRemove = recordsData
        .map((item) => item.id)
        .indexOf(args.id);

      if (recordToRemove === -1)
        throw new UserInputError("Record with provided ID does not exist", {
          invalidArgs: args.id,
        });
      recordsData.splice(recordToRemove, 1);

      return {
        id: args.id,
      };
    },
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
  DateTime: () => {
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
  debug: true,
});

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
