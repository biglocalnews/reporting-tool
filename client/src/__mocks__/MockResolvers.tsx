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
      id: "1",
      category: "Gender",
      categoryValue: "Cisgender Men",
    },
    count: 0,
  },
  {
    id: "2",
    category: {
      id: "2",
      category: "Gender",
      categoryValue: "Cisgender women",
    },
    count: 0,
  },
  {
    id: "3",
    category: {
      id: "3",
      category: "Gender",
      categoryValue: "Non-binary",
    },
    count: 0,
  },
  {
    id: "4",
    category: {
      id: "4",
      category: "Gender",
      categoryValue: "Gender non-conforming",
    },
    count: 0,
  },
  {
    id: "5",
    category: {
      id: "5",
      category: "Gender",
      categoryValue: "Trans women",
    },
    count: 0,
  },
  {
    id: "6",
    category: {
      id: "6",
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
    publicationDate: "2020-12-20T00:00:00",
    dataset: {
      id: "5a8ee1d5-2b5a-49db-b466-68fe50a27cdb",
      name: "Breakfast Hour",
    },
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
    dataset: (parent, args, ctx, info) => datasets.get(args.id),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    user: () => users.get("1"),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    record: (parent, args, ctx, info) =>
      recordsData.find((item) => item.id === args.id),
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
    targets: [
      {
        id: "2d501688-92e3-455e-9685-01141de3dbaf",
        category: {
          id: "1",
          category: "Gender",
          categoryValue: "Cisgender men",
        },
      },
      {
        id: "eccf90e8-3261-46c1-acd5-507f9113ff72",
        category: {
          id: "2",
          category: "Gender",
          categoryValue: "Cisgender women",
        },
      },
      {
        id: "40eaeafc-3311-4294-a639-a826eb6495ab",
        category: {
          id: "3",
          category: "Gender",
          categoryValue: "Non-binary",
        },
      },
      {
        id: "a459ed7f-5573-4d5b-ade6-3070bc8bd2db",
        category: {
          id: "4",
          category: "Gender",
          categoryValue: "Gender non-conforming",
        },
      },
      {
        id: "5",
        category: {
          id: "662557e5-aca8-4cec-ad72-119ad9cda81b",
          category: "Gender",
          categoryValue: "Trans women",
        },
      },
      {
        id: "9352b16b-2607-4f7d-a272-fe6dedd8165a",
        category: {
          id: "6",
          category: "Gender",
          categoryValue: "Trans men",
        },
      },
    ],
  }),
  DateTime: () => {
    return "12/20/2020";
  },
};
