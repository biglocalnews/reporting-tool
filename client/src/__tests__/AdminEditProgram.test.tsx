import { MockedProvider } from "@apollo/client/testing";
import "@testing-library/jest-dom/extend-expect";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route } from "react-router-dom";
import { ADMIN_DELETE_PROGRAM } from "../graphql/__mutations__/AdminDeleteProgram.gql";
import { ADMIN_RESTORE_PROGRAM } from "../graphql/__mutations__/AdminRestoreProgram.gql";
import { ADMIN_UPDATE_PROGRAM } from "../graphql/__mutations__/AdminUpdateProgram.gql";
import { ADMIN_GET_ALL_CATEGORIES } from "../graphql/__queries__/AdminGetAllCategories.gql";
import { ADMIN_GET_ALL_TEAMS } from "../graphql/__queries__/AdminGetAllTeams.gql";
import { ADMIN_GET_PROGRAM } from "../graphql/__queries__/AdminGetProgram.gql";
import { EditProgram } from "../pages/Admin/EditProgram";
import { tick } from "./utils";

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
  expect(screen.getByRole("button", { name: /stopTrackingCategory/ }));
  expect(screen.getByLabelText(/g1/)).toHaveValue("33%");
  expect(screen.getByLabelText(/g2/)).toHaveValue("34%");
  expect(screen.getByLabelText(/g3/)).toHaveValue("33%");
  expect(
    screen.getByRole("textbox", { name: /addNewSegment/ })
  ).toBeInTheDocument();
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
            teamId: "eeeeeee4-b910-4f6e-8f3c-8201c9999999",
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

it("can remove tracked targets", async () => {
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
            teamId: "eeeeeee4-b910-4f6e-8f3c-8201c9999999",
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
                id: "00000004-b910-4f6e-8f3c-8201c9555556",
                target: 0.5,
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

  const g2Stop = screen.getAllByRole("button", {
    name: /stopTrackingSegment/,
  })[1];
  fireEvent.click(g2Stop);
  await tick();

  const g3 = screen.getByLabelText(/g3/);
  fireEvent.change(g3, { target: { value: "50%" } });
  await tick();

  const confirmRemove = screen.getByRole("button", { name: /confirm.yes/ });
  fireEvent.click(confirmRemove);
  await tick();

  const submit = screen.getByRole("button", { name: /save/ });
  fireEvent.click(submit);

  // Validate the form
  await tick();
  // Submit the form and get the response
  await tick();

  expect(screen.queryByText(/saveError/)).not.toBeInTheDocument();
});

it("can add new tracked targets", async () => {
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
            teamId: "eeeeeee4-b910-4f6e-8f3c-8201c9999999",
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
                target: 0.25,
                categoryValue: {
                  id: "00000004-b910-4f6e-8f3c-8201c0000000",
                  name: "g1",
                  category: { id: "00000004-b910-4f6e-8f3c-8201c1111111" },
                },
              },
              {
                id: "00000004-b910-4f6e-8f3c-8201c9555555",
                categoryValue: {
                  id: "00000004-b910-4f6e-8f3c-8201c0000001",
                  name: "g2",
                  category: {
                    id: "00000004-b910-4f6e-8f3c-8201c1111111",
                  },
                },
                target: 0.25,
              },
              {
                id: "00000004-b910-4f6e-8f3c-8201c9555556",
                target: 0.25,
                categoryValue: {
                  id: "00000004-b910-4f6e-8f3c-8201c0000002",
                  name: "g3",
                  category: { id: "00000004-b910-4f6e-8f3c-8201c1111111" },
                },
              },
              {
                target: 0.25,
                categoryValue: {
                  name: "g4",
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
  const g2 = screen.getByLabelText(/g2/);
  const g3 = screen.getByLabelText(/g3/);
  fireEvent.change(g1, { target: { value: "25%" } });
  fireEvent.change(g2, { target: { value: "25%" } });
  fireEvent.change(g3, { target: { value: "25%" } });
  await tick();

  const addNew = screen.getByRole("textbox", { name: /addNewSegment/ });
  fireEvent.change(addNew, { target: { value: "g4" } });
  await tick();
  fireEvent.click(screen.getByRole("button", { name: /addNewSegment/ }));
  await tick();

  const g4 = screen.getByLabelText(/g4/);
  fireEvent.change(g4, { target: { value: "25%" } });
  await tick();

  const submit = screen.getByRole("button", { name: /save/ });
  fireEvent.click(submit);

  // Validate the form
  await tick();
  // Submit the form and get the response
  await tick();

  expect(screen.queryByText(/saveError/)).not.toBeInTheDocument();
});

it("can add and remove tracked categories", async () => {
  const genderTargets = [
    {
      id: "00000004-b910-4f6e-8f3c-8201c9999999",
      target: 0.33,
      categoryValue: {
        id: "00000004-b910-4f6e-8f3c-8201c0000000",
        name: "g1",
        category: { id: "00000004-b910-4f6e-8f3c-8201c1111111" },
      },
    },
    {
      id: "00000004-b910-4f6e-8f3c-8201c9555555",
      target: 0.34,
      categoryValue: {
        id: "00000004-b910-4f6e-8f3c-8201c0000001",
        name: "g2",
        category: {
          id: "00000004-b910-4f6e-8f3c-8201c1111111",
        },
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
  ];

  const otherCatTargets = [
    {
      target: 1,
      categoryValue: {
        name: "c1",
        category: { id: "hhhhhhh4-b910-4f6e-8f3c-8201c9999999" },
      },
    },
  ];

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
            teamId: "eeeeeee4-b910-4f6e-8f3c-8201c9999999",
            datasets: [
              {
                id: "fffff3b4-b910-4f6e-8f3c-8201c9999999",
                name: "DS1",
                description: "first dataset",
              },
            ],
            targets: [...genderTargets, ...otherCatTargets],
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
    {
      request: {
        query: ADMIN_UPDATE_PROGRAM,
        variables: {
          input: {
            id: "df6413b4-b910-4f6e-8f3c-8201c9e65af3",
            name: "My Program",
            description: "whatever",
            teamId: "eeeeeee4-b910-4f6e-8f3c-8201c9999999",
            datasets: [
              {
                id: "fffff3b4-b910-4f6e-8f3c-8201c9999999",
                name: "DS1",
                description: "first dataset",
              },
            ],
            targets: [...otherCatTargets],
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

  // -- Submit form with added category
  const catBox = screen.getByRole("combobox", { name: /addNewCategory/ });
  fireEvent.keyDown(catBox, {
    key: "enter",
    code: 13,
    charCode: 13,
    keyCode: 13,
  });
  await tick();
  const cat = document.querySelector("[title='Cat2']");
  expect(cat).toBeInTheDocument();
  fireEvent.click(cat!);
  await tick();

  const addNew = screen.getAllByRole("textbox", { name: /addNewSegment/ })[1];
  fireEvent.change(addNew, { target: { value: "c1" } });
  await tick();

  fireEvent.click(screen.getAllByRole("button", { name: /addNewSegment/ })[1]);
  await tick();

  const c1 = screen.getByLabelText(/c1/);
  fireEvent.change(c1, { target: { value: "100%" } });
  await tick();

  const submit = screen.getByRole("button", { name: /save/ });
  fireEvent.click(submit);

  // Validate the form
  await tick();
  // Submit the form and get the response
  await tick();
  expect(screen.queryByText(/saveError/)).not.toBeInTheDocument();

  // -- Submit form with removed category
  fireEvent.click(
    screen.getAllByRole("button", { name: /stopTrackingCategory/ })[0]
  );
  await tick();

  const confirmRemove = screen.getByRole("button", { name: /confirm.yes/ });
  fireEvent.click(confirmRemove);
  await tick();

  fireEvent.click(submit);
  // Validate the form
  await tick();
  // Submit the form and get the response
  await tick();
  expect(screen.queryByText(/saveError/)).not.toBeInTheDocument();
});

it("can edit a dataset", async () => {
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
            teamId: "eeeeeee4-b910-4f6e-8f3c-8201c9999999",
            datasets: [
              {
                id: "fffff3b4-b910-4f6e-8f3c-8201c9999999",
                name: "DS1 - edited",
                description: "first dataset - edited",
              },
            ],
            targets: [
              {
                id: "00000004-b910-4f6e-8f3c-8201c9999999",
                target: 0.33,
                categoryValue: {
                  id: "00000004-b910-4f6e-8f3c-8201c0000000",
                  name: "g1",
                  category: { id: "00000004-b910-4f6e-8f3c-8201c1111111" },
                },
              },
              {
                id: "00000004-b910-4f6e-8f3c-8201c9555555",
                categoryValue: {
                  id: "00000004-b910-4f6e-8f3c-8201c0000001",
                  name: "g2",
                  category: {
                    id: "00000004-b910-4f6e-8f3c-8201c1111111",
                  },
                },
                target: 0.34,
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

  fireEvent.change(screen.getByRole("textbox", { name: /datasetName/ }), {
    target: { value: "DS1 - edited" },
  });
  fireEvent.change(
    screen.getByRole("textbox", { name: /datasetDescription/ }),
    { target: { value: "first dataset - edited" } }
  );

  await tick();

  fireEvent.click(screen.getByRole("button", { name: /save/ }));

  // Validation should succeed
  await tick();
  // save request should be sent
  await tick();

  expect(screen.queryByText(/saveError/)).not.toBeInTheDocument();
});

it("can add and remove datasets", async () => {
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
            teamId: "eeeeeee4-b910-4f6e-8f3c-8201c9999999",
            datasets: [
              {
                name: "DS2",
                description: "second dataset",
              },
            ],
            targets: [
              {
                id: "00000004-b910-4f6e-8f3c-8201c9999999",
                target: 0.33,
                categoryValue: {
                  id: "00000004-b910-4f6e-8f3c-8201c0000000",
                  name: "g1",
                  category: { id: "00000004-b910-4f6e-8f3c-8201c1111111" },
                },
              },
              {
                id: "00000004-b910-4f6e-8f3c-8201c9555555",
                categoryValue: {
                  id: "00000004-b910-4f6e-8f3c-8201c0000001",
                  name: "g2",
                  category: {
                    id: "00000004-b910-4f6e-8f3c-8201c1111111",
                  },
                },
                target: 0.34,
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

  fireEvent.click(screen.getByRole("button", { name: /addDataset/ }));
  await tick();

  fireEvent.click(screen.getAllByRole("button", { name: /deleteDataset/ })[0]);
  await tick();

  fireEvent.click(screen.getByRole("button", { name: /confirm.yes/ }));
  await tick();

  fireEvent.change(screen.getByRole("textbox", { name: /datasetName/ }), {
    target: { value: "DS2" },
  });
  fireEvent.change(
    screen.getByRole("textbox", { name: /datasetDescription/ }),
    { target: { value: "second dataset" } }
  );

  await tick();

  fireEvent.click(screen.getByRole("button", { name: /save/ }));

  // Validation should succeed
  await tick();
  // save request should be sent
  await tick();
  expect(screen.queryByText(/saveError/)).not.toBeInTheDocument();
});

it("can edit basic info: name and description and team", async () => {
  const mocks = [
    ...apolloMocks,
    {
      request: {
        query: ADMIN_UPDATE_PROGRAM,
        variables: {
          input: {
            id: "df6413b4-b910-4f6e-8f3c-8201c9e65af3",
            name: "new name",
            description: "new description",
            teamId: "fffffff4-b910-4f6e-8f3c-8201c9999999",
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
                target: 0.33,
                categoryValue: {
                  id: "00000004-b910-4f6e-8f3c-8201c0000000",
                  name: "g1",
                  category: { id: "00000004-b910-4f6e-8f3c-8201c1111111" },
                },
              },
              {
                id: "00000004-b910-4f6e-8f3c-8201c9555555",
                categoryValue: {
                  id: "00000004-b910-4f6e-8f3c-8201c0000001",
                  name: "g2",
                  category: {
                    id: "00000004-b910-4f6e-8f3c-8201c1111111",
                  },
                },
                target: 0.34,
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

  fireEvent.change(screen.getByRole("textbox", { name: /form.name/ }), {
    target: { value: "new name" },
  });

  fireEvent.change(screen.getByRole("textbox", { name: /form.description/ }), {
    target: { value: "new description" },
  });

  await tick();

  const teamBox = screen.getByRole("combobox", { name: /form.team/ });
  userEvent.type(teamBox, "Team2");
  await tick();

  fireEvent.keyDown(teamBox, {
    key: "enter",
    code: 13,
    charCode: 13,
    keyCode: 13,
  });

  await tick();

  fireEvent.click(screen.getByRole("button", { name: /save/ }));

  // Validation should succeed
  await tick();
  // save request should be sent
  await tick();
  expect(screen.queryByText(/saveError/)).not.toBeInTheDocument();
});

it("can deactivate and reactivate a program", async () => {
  const deactivated = JSON.parse(JSON.stringify(PROGRAM));
  deactivated.data.program.deleted = new Date();

  const mocks = [
    ...apolloMocks,
    {
      request: {
        query: ADMIN_DELETE_PROGRAM,
        variables: {
          input: "df6413b4-b910-4f6e-8f3c-8201c9e65af3",
        },
      },
      result: {
        data: {
          deleteProgram: null,
        },
      },
    },
    {
      request: {
        query: ADMIN_GET_PROGRAM,
        variables: {
          id: "df6413b4-b910-4f6e-8f3c-8201c9e65af3",
        },
      },
      result: deactivated,
    },
    {
      request: {
        query: ADMIN_RESTORE_PROGRAM,
        variables: {
          input: "df6413b4-b910-4f6e-8f3c-8201c9e65af3",
        },
      },
      result: {
        data: {
          restoreProgram: {
            data: {
              id: "df6413b4-b910-4f6e-8f3c-8201c9e65af3",
            },
          },
        },
      },
    },
    {
      request: {
        query: ADMIN_GET_PROGRAM,
        variables: {
          id: "df6413b4-b910-4f6e-8f3c-8201c9e65af3",
        },
      },
      result: PROGRAM,
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

  fireEvent.click(screen.getByRole("button", { name: /form.delete$/ }));

  await tick();

  fireEvent.click(screen.getByRole("button", { name: /confirm.yes/ }));

  await tick();

  expect(screen.queryByText(/Error/)).not.toBeInTheDocument();
  expect(screen.queryByText(/alreadyDeletedTitle/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /form.restore$/ }));

  await tick();

  expect(screen.queryByText(/Error/)).not.toBeInTheDocument();
  expect(screen.queryByText(/alreadyDeletedTitle/)).not.toBeInTheDocument();
});
