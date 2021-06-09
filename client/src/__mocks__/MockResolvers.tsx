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

const genderDescription = `Gender identity expresses one's innermost concept of self as male, 
female, a blend of both or neither - how individuals perceive 
themselves and what they call themselves. Someone's gender identity
can be the same (cisgender) or different (transgender) from their 
sex assigned at birth.`;

const disabilityDescription = `A disability is any condition of the body or mind (impairment) 
that makes it more difficult for the person with the condition to do certain activities 
(activity limitation) and interact with the world around them (participation restrictions). 
Some disabilities may be hidden or not easy to see.`;

// Mocked categories and values
const categoryData = [
  {
    id: "a7122153-6cb7-4ea0-a9bd-05dab5a9b293",
    category: {
      id: "51349e29-290e-4398-a401-5bf7d04af75e",
      category: "Gender",
      categoryValue: "Non-binary",
      description: genderDescription,
    },
    count: 0,
  },
  {
    id: "6196eda7-344c-42f9-a367-59cab0b8de33",
    category: {
      id: "0034d015-0652-497d-ab4a-d42b0bdf08cb",
      category: "Gender",
      categoryValue: "Cisgender women",
      description: genderDescription,
    },
    count: 0,
  },
  {
    id: "5dfb2847-ef6a-44f9-bd54-547b5e018e90",
    category: {
      id: "d237a422-5858-459c-bd01-a0abdc077e5b",
      category: "Gender",
      categoryValue: "Cisgender men",
      description: genderDescription,
    },
    count: 0,
  },
  {
    id: "b1f9b316-ed18-4e80-bc90-2a4702c68cd5",
    category: {
      id: "662557e5-aca8-4cec-ad72-119ad9cda81b",
      category: "Gender",
      categoryValue: "Trans women",
      description: genderDescription,
    },
    count: 0,
  },
  {
    id: "674f549b-48f0-4b7a-932b-e8f18a76a4c2",
    category: {
      id: "1525cce8-7db3-4e73-b5b0-d2bd14777534",
      category: "Gender",
      categoryValue: "Trans men",
      description: genderDescription,
    },
    count: 0,
  },
  {
    id: "e5025b57-9101-45ce-a7a8-29da53e1d03d",
    category: {
      id: "a72ced2b-b1a6-4d3d-b003-e35e980960df",
      category: "Gender",
      categoryValue: "Gender non-conforming",
      description: genderDescription,
    },
    count: 0,
  },
  {
    id: "735bc484-c727-4338-b87a-784fc3663267",
    category: {
      id: "c36958cb-cc62-479e-ab61-eb03896a981c",
      category: "Disability",
      categoryValue: "Disability",
      description: disabilityDescription,
    },
    count: 0,
  },
  {
    id: "6c34da2c-1102-4ecc-ae2d-58499da3771e",
    category: {
      id: "55119215-71e9-43ca-b2c1-7e7fb8cec2fd",
      category: "Disability",
      categoryValue: "No disability",
      description: disabilityDescription,
    },
    count: 8,
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
        id: "40eaeafc-3311-4294-a639-a826eb6495ab",
        category: {
          id: "51349e29-290e-4398-a401-5bf7d04af75e",
          category: "Gender",
          categoryValue: "Non-binary",
        },
      },
      {
        id: "eccf90e8-3261-46c1-acd5-507f9113ff72",
        category: {
          id: "0034d015-0652-497d-ab4a-d42b0bdf08cb",
          category: "Gender",
          categoryValue: "Cisgender women",
        },
      },
      {
        id: "2d501688-92e3-455e-9685-01141de3dbaf",
        category: {
          id: "d237a422-5858-459c-bd01-a0abdc077e5b",
          category: "Gender",
          categoryValue: "Cisgender men",
        },
      },
      {
        id: "4f7897c2-32a1-4b1e-9749-1a8066faca01",
        category: {
          id: "662557e5-aca8-4cec-ad72-119ad9cda81b",
          category: "Gender",
          categoryValue: "Trans women",
        },
      },
      {
        id: "9352b16b-2607-4f7d-a272-fe6dedd8165a",
        category: {
          id: "1525cce8-7db3-4e73-b5b0-d2bd14777534",
          category: "Gender",
          categoryValue: "Trans men",
        },
      },
      {
        id: "a459ed7f-5573-4d5b-ade6-3070bc8bd2db",
        category: {
          id: "a72ced2b-b1a6-4d3d-b003-e35e980960df",
          category: "Gender",
          categoryValue: "Gender non-conforming",
        },
      },
      {
        id: "b5be10ce-103f-41f2-b4c4-603228724993",
        target: 0.5,
        category: {
          id: "c36958cb-cc62-479e-ab61-eb03896a981c",
          category: "Disability",
          categoryValue: "Disability",
        },
      },
      {
        id: "6e6edce5-3d24-4296-b929-5eec26d52afc",
        target: 0.5,
        category: {
          id: "55119215-71e9-43ca-b2c1-7e7fb8cec2fd",
          category: "Disability",
          categoryValue: "No disability",
        },
      },
    ],
  }),
  DateTime: () => {
    return "12/20/2020";
  },
};
