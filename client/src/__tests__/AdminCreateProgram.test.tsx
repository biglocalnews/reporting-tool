import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/extend-expect";
import React from "react";
import { Route, MemoryRouter } from "react-router-dom";
import { MockedProvider } from "@apollo/client/testing";

import { tick } from "./utils";

import { EditProgram } from "../pages/Admin/EditProgram";
import { ADMIN_GET_ALL_CATEGORIES } from "../graphql/__queries__/AdminGetAllCategories.gql";
import { ADMIN_GET_ALL_TEAMS } from "../graphql/__queries__/AdminGetAllTeams.gql";
import { ADMIN_UPDATE_PROGRAM } from "../graphql/__mutations__/AdminUpdateProgram.gql";
import { ADMIN_GET_PROGRAM } from "../graphql/__queries__/AdminGetProgram.gql";

const PROGRAM = {
  data: {
    program: {
      name: "My Program",
      description: "whatever",
      team: { name: "Team1", id: "eeeeeee4-b910-4f6e-8f3c-8201c9999999" },
      deleted: null,
      tags: [
        {
          id: "ccccc3b4-b910-4f6e-8f3c-8201c9999999",
          name: "OtherTag",
        },
      ],
      datasets: [
        {
          id: "fffff3b4-b910-4f6e-8f3c-8201c9999999",
          name: "DS1",
          description: "first dataset",
        },
      ],
      targets: [
        {
          id: "00000004-b910-4f6e-8f3c-8201c9999999",
          categoryValue: {
            id: "00000004-b910-4f6e-8f3c-8201c0000000",
            name: "g1",
            category: {
              id: "00000004-b910-4f6e-8f3c-8201c1111111",
              name: "gender",
              description: "test cat 1: gender",
            },
          },
          target: 0.33,
        },
        {
          id: "00000004-b910-4f6e-8f3c-8201c9555555",
          categoryValue: {
            id: "00000004-b910-4f6e-8f3c-8201c0000001",
            name: "g2",
            category: {
              id: "00000004-b910-4f6e-8f3c-8201c1111111",
              name: "gender",
              description: "test cat 1: gender",
            },
          },
          target: 0.34,
        },
        {
          id: "00000004-b910-4f6e-8f3c-8201c9555556",
          categoryValue: {
            id: "00000004-b910-4f6e-8f3c-8201c0000002",
            name: "g3",
            category: {
              id: "00000004-b910-4f6e-8f3c-8201c1111111",
              name: "gender",
              description: "test cat 1: gender",
            },
          },
          target: 0.33,
        },
      ],
    },
  },
};

const TEAMS = {
  data: {
    teams: [
      { name: "Team1", id: "eeeeeee4-b910-4f6e-8f3c-8201c9999999" },
      { name: "Team2", id: "fffffff4-b910-4f6e-8f3c-8201c9999999" },
    ],
  },
};

const CATEGORIES = {
  data: {
    categories: [
      {
        name: "gender",
        id: "00000004-b910-4f6e-8f3c-8201c1111111",
        description: "test cat 1: gender",
      },
      {
        name: "Cat2",
        id: "hhhhhhh4-b910-4f6e-8f3c-8201c9999999",
        description: "test cat 2: something else",
      },
    ],
  },
};

const apolloMocks = [
  {
    request: {
      query: ADMIN_GET_PROGRAM,
      variables: {
        id: "df6413b4-b910-4f6e-8f3c-8201c9e65af3",
      },
    },
    result: PROGRAM,
  },
  {
    request: { query: ADMIN_GET_ALL_TEAMS },
    result: TEAMS,
  },
  {
    request: { query: ADMIN_GET_ALL_CATEGORIES },
    result: CATEGORIES,
  },
];

it("renders a program for editing", async () => {
  render(
    <MockedProvider mocks={apolloMocks}>
      <MemoryRouter initialEntries={["/df6413b4-b910-4f6e-8f3c-8201c9e65af3"]}>
        <Route path="/:programId">
          <EditProgram />
        </Route>
      </MemoryRouter>
    </MockedProvider>
  );

  await tick();

  // Basic info
  expect(screen.getByRole("textbox", { name: /name/ })).toHaveValue(
    "My Program"
  );
  expect(screen.getByRole("textbox", { name: /description/ })).toHaveValue(
    "whatever"
  );
  const cb = screen.getByRole("combobox", { name: /team/ });
  // TODO(jnu): something weird going on with the initial render of these
  // comboboxes, probably affects accessibility.
  expect(cb.parentElement?.parentElement?.textContent).toEqual("Team1");

  // Categories
  expect(screen.queryByText(/^gender$/)).toBeInTheDocument();
  expect(screen.queryByText(/test cat 1: gender/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /stopTracking/ }));
  expect(screen.getByLabelText(/g1/)).toHaveValue("33%");
  expect(screen.getByLabelText(/g2/)).toHaveValue("34%");
  expect(screen.getByLabelText(/g3/)).toHaveValue("33%");
  expect(screen.getByLabelText(/addNewSegment/)).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: /datasetName/ })).toHaveValue(
    "DS1"
  );
  expect(
    screen.getByRole("textbox", { name: /datasetDescription/ })
  ).toHaveValue("first dataset");
});

it("can set new target values for existing targets", async () => {
  const mocks = [
    ...apolloMocks,
    {
      request: {
        query: ADMIN_UPDATE_PROGRAM,
        variables: {
          input: {
            id: "df6413b4-b910-4f6e-8f3c-8201c9e65af3",
            name: "My Program",
            description: "whatever",
            datasets: [
              {
                id: "fffff3b4-b910-4f6e-8f3c-8201c9999999",
                name: "DS1",
                description: "first dataset",
              },
            ],
            targets: [
              {
                id: "00000004-b910-4f6e-8f3c-8201c9999999",
                target: 0.5,
                categoryValue: {
                  id: "00000004-b910-4f6e-8f3c-8201c0000000",
                  name: "g1",
                  category: { id: "00000004-b910-4f6e-8f3c-8201c1111111" },
                },
              },
              {
                id: "00000004-b910-4f6e-8f3c-8201c9555555",
                target: 0.17,
                categoryValue: {
                  id: "00000004-b910-4f6e-8f3c-8201c0000001",
                  name: "g2",
                  category: { id: "00000004-b910-4f6e-8f3c-8201c1111111" },
                },
              },
              {
                id: "00000004-b910-4f6e-8f3c-8201c9555556",
                target: 0.33,
                categoryValue: {
                  id: "00000004-b910-4f6e-8f3c-8201c0000002",
                  name: "g3",
                  category: { id: "00000004-b910-4f6e-8f3c-8201c1111111" },
                },
              },
            ],
          },
        },
      },
      result: {
        data: {
          updateProgram: {
            id: "df6413b4-b910-4f6e-8f3c-8201c9e65af3",
          },
        },
      },
    },
  ];

  render(
    <MockedProvider mocks={mocks}>
      <MemoryRouter initialEntries={["/df6413b4-b910-4f6e-8f3c-8201c9e65af3"]}>
        <Route path="/:programId">
          <EditProgram />
        </Route>
      </MemoryRouter>
    </MockedProvider>
  );

  await tick();

  const g1 = screen.getByLabelText(/g1/);
  fireEvent.change(g1, { target: { value: "50%" } });
  await tick();

  const submit = screen.getByRole("button", { name: /save/ });
  fireEvent.click(submit);
  await tick();

  // Validation should have blocked the request
  expect(screen.queryByText(/100%/)).toBeInTheDocument();

  const g2 = screen.getByLabelText(/g2/);
  fireEvent.change(g2, { target: { value: "17%" } });
  await tick();

  fireEvent.click(submit);

  // Validation should succeed
  await tick();
  // save request should be sent
  await tick();
  expect(screen.queryByText(/saveError/)).not.toBeInTheDocument();
});
