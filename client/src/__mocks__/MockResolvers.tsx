import { UserInputError } from "apollo-server";

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
    category: {
      category: "Gender",
      categoryValue: "Cisgender Men",
    },
    count: 0,
  },
  {
    id: "2",
    category: {
      category: "Gender",
      categoryValue: "Cisgender women",
    },
    count: 0,
  },
  {
    id: "3",
    category: {
      category: "Gender",
      categoryValue: "Non-binary",
    },
    count: 0,
  },
  {
    id: "4",
    category: {
      category: "Gender",
      categoryValue: "Gender non-conforming",
    },
    count: 0,
  },
  {
    id: "5",
    category: {
      category: "Gender",
      categoryValue: "Trans women",
    },
    count: 0,
  },
  {
    id: "6",
    category: {
      category: "Gender",
      categoryValue: "Trans men",
    },
    count: 0,
  },
];

// Mocked records
const recordsData = [
  {
    id: "05caae8d-bb1a-416e-9dda-bb251fe474ff",
    publicationDate: "2020-12-20",
    entries: categoryData,
  },
];

// Mocked datasets
const datasets = new Map([
  [
    "5a8ee1d5-2b5a-49db-b466-68fe50a27cdb",
    {
      id: "5a8ee1d5-2b5a-49db-b466-68fe50a27cdb",
      name: "Breakfast Hour",
      tags: [
        {
          name: "News",
        },
      ],
      records: recordsData,
    },
  ],
]);

export const mockResolvers = {
  Team: () => ({
    programs: () => [{}],
  }),
  User: () => ({
    teams: () => [{}],
  }),
  Query: () => ({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    dataset: (parent, args, ctx, info) => datasets.get(args.id) || {},
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    user: () => users.get("1"),
  }),
  Mutation: () => ({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    deleteRecord: (parent, args, ctx, info) => {
      const recordToRemove = recordsData
        .map((item) => item.id)
        .indexOf(args.id);

      if (recordToRemove === -1)
        throw new UserInputError("Record with provided ID does not exist", {
          invalidArgs: args.id,
        });
      recordsData.splice(recordToRemove, 1);

      return args.id;
    },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    updateRecord: (parent, args, ctx, info) => {
      const recordToUpdate = recordsData[0];

      return { input: recordToUpdate };
    },
  }),
  Program: () => ({
    id: "25c140cc-6cd0-4bd3-8230-35b56e59481a",
    name: "BBC News",
    datasets: Array.from(datasets.values()),
  }),
  Date: () => {
    return "12/20/2020";
  },
};
