export const TEAMS = {
  data: {
    teams: [
      { name: "Team1", id: "eeeeeee4-b910-4f6e-8f3c-8201c9999999" },
      { name: "Team2", id: "fffffff4-b910-4f6e-8f3c-8201c9999999" },
    ],
  },
};

export const PROGRAMS = {
  data: {
    programs: [
      {
        id: "zzzzz3b4-b910-4f6e-8f3c-8201c9e00000",
        name: "Some Program",
        deleted: null,
        tags: [
          {
            id: "aaaa13b4-b910-4f6e-8f3c-8201c9999999",
            name: "MyTag",
          },
        ],
        team: {
          id: "472d17da-ff8b-4743-823f-3f01ea21a349",
          name: "News Team",
        },
        targets: [
          { categoryValue: { category: { name: "gender" } } },
          { categoryValue: { category: { name: "gender" } } },
          { categoryValue: { category: { name: "gender" } } },
          { categoryValue: { category: { name: "gender" } } },
          { categoryValue: { category: { name: "gender" } } },
          { categoryValue: { category: { name: "disability" } } },
          { categoryValue: { category: { name: "disability" } } },
        ],
      },
      {
        id: "bbbbb3b4-b910-4f6e-8f3c-8201c9e00000",
        name: "Other Program",
        deleted: null,
        tags: [
          {
            id: "ccccc3b4-b910-4f6e-8f3c-8201c9999999",
            name: "OtherTag",
          },
        ],
        team: {
          id: "472d17da-ff8b-4743-823f-3f01ea21a349",
          name: "News Team",
        },
        targets: [
          { categoryValue: { category: { name: "gender" } } },
          { categoryValue: { category: { name: "gender" } } },
          { categoryValue: { category: { name: "gender" } } },
          { categoryValue: { category: { name: "gender" } } },
          { categoryValue: { category: { name: "gender" } } },
          { categoryValue: { category: { name: "disability" } } },
          { categoryValue: { category: { name: "disability" } } },
          { categoryValue: { category: { name: "race" } } },
          { categoryValue: { category: { name: "race" } } },
          { categoryValue: { category: { name: "race" } } },
          { categoryValue: { category: { name: "race" } } },
          { categoryValue: { category: { name: "race" } } },
          { categoryValue: { category: { name: "race" } } },
        ],
      },
    ],
  },
};

export const USERS = {
  data: {
    users: [
      {
        id: "df6413b4-b910-4f6e-8f3c-8201c9e65af3",
        firstName: "Daisy",
        lastName: "Carrot",
        active: true,
        email: "admin@notrealemail.info",
        roles: [{ name: "admin", description: "" }],
        team: {
          id: "472d17da-ff8b-4743-823f-3f01ea21a349",
        },
      },
      {
        id: "a47085ba-3d01-46a4-963b-9ffaeda18113",
        firstName: "Penelope",
        lastName: "Pineapple",
        active: true,
        email: "other@notrealemail.info",
        roles: [],
        team: {
          id: "472d17da-ff8b-4743-823f-3f01ea21a349",
        },
      },
      {
        id: "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
        firstName: "Cat",
        lastName: "Berry",
        active: true,
        email: "tester@notrealemail.info",
        roles: [],
        team: {
          id: "472d17da-ff8b-4743-823f-3f01ea21a349",
        },
      },
    ],
  },
};
