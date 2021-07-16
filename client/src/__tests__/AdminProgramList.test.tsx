import { MockedProvider } from "@apollo/client/testing";
import "@testing-library/jest-dom/extend-expect";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ADMIN_CREATE_PROGRAM } from "../graphql/__mutations__/AdminCreateProgram.gql";
import { ADMIN_GET_ALL_PROGRAMS } from "../graphql/__queries__/AdminGetAllPrograms.gql";
import { ADMIN_GET_ALL_TEAMS } from "../graphql/__queries__/AdminGetAllTeams.gql";
import { ADMIN_GET_PROGRAM } from "../graphql/__queries__/AdminGetProgram.gql";
import { ProgramList } from "../pages/Admin/ProgramList";
import { PROGRAMS, TEAMS } from "./fixtures";
import { tick } from "./utils";

const TEMPLATE_PROGRAM = {
  data: {
    program: {
      name: "Other Program",
      description: "whatever",
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
            },
          },
          target: 0.33,
        },
      ],
    },
  },
};

it("renders list of programs for the admin to manage", async () => {
  const apolloMocks = [
    {
      request: { query: ADMIN_GET_ALL_PROGRAMS },
      result: PROGRAMS,
    },
    {
      request: { query: ADMIN_GET_ALL_TEAMS },
      result: TEAMS,
    },
  ];

  render(
    <MockedProvider mocks={apolloMocks}>
      <MemoryRouter>
        <ProgramList />
      </MemoryRouter>
    </MockedProvider>
  );

  await tick();

  expect(screen.getAllByRole("row")).toHaveLength(3);
  expect(screen.getByText("Some Program")).toBeInTheDocument();
  expect(screen.getByText("Other Program")).toBeInTheDocument();
  expect(screen.getByText("disability, gender")).toBeInTheDocument();
  expect(screen.getByText("disability, gender, race")).toBeInTheDocument();
});

it("lets admin create new program", async () => {
  const apolloMocks = [
    {
      request: { query: ADMIN_GET_ALL_PROGRAMS },
      result: PROGRAMS,
    },
    {
      request: { query: ADMIN_GET_ALL_TEAMS },
      result: TEAMS,
    },
    {
      request: {
        query: ADMIN_CREATE_PROGRAM,
        variables: {
          input: {
            name: "new program",
            teamId: "eeeeeee4-b910-4f6e-8f3c-8201c9999999",
          },
        },
      },
      result: {
        data: { createProgram: { id: "foo" } },
      },
    },
  ];

  render(
    <MockedProvider mocks={apolloMocks}>
      <MemoryRouter>
        <ProgramList />
      </MemoryRouter>
    </MockedProvider>
  );

  await tick();

  const createButton = screen.getByRole("button", { name: /index.add/ });
  fireEvent.click(createButton);

  const saveButton = screen.getByRole("button", { name: /save/ });
  expect(saveButton).toBeInTheDocument();

  fireEvent.change(screen.getByRole("textbox", { name: /name/ }), {
    target: { value: "new program" },
  });

  // Incomplete form can't be submitted
  fireEvent.click(saveButton);
  await tick();

  // Assign team
  const teamBox = screen.getByRole("combobox", { name: /team/ });
  userEvent.type(teamBox, "T");
  await tick();
  expect(screen.getByRole("option", { name: /Team1/ })).toBeInTheDocument();
  fireEvent.keyDown(teamBox, {
    key: "enter",
    code: 13,
    charCode: 13,
    keyCode: 13,
  });
  await tick();

  // Now form can be saved
  fireEvent.click(saveButton);
  // One tick for form validation
  await tick();
  // Another tick for GraphQL response
  await tick();
  // If there's no error here everything went well!
  expect(screen.getByText(/success/)).toBeInTheDocument();
  expect(screen.queryByText(/saveError/)).not.toBeInTheDocument();
});

it("lets admin create new programs based on other programs", async () => {
  const apolloMocks = [
    {
      request: { query: ADMIN_GET_ALL_PROGRAMS },
      result: PROGRAMS,
    },
    {
      request: { query: ADMIN_GET_ALL_TEAMS },
      result: TEAMS,
    },
    {
      request: {
        query: ADMIN_GET_PROGRAM,
        variables: {
          id: "bbbbb3b4-b910-4f6e-8f3c-8201c9e00000",
        },
      },
      result: TEMPLATE_PROGRAM,
    },
    {
      request: {
        query: ADMIN_CREATE_PROGRAM,
        variables: {
          input: {
            name: "new program",
            teamId: "eeeeeee4-b910-4f6e-8f3c-8201c9999999",
            targets: [
              {
                target: 0.33,
                categoryValue: {
                  category: {
                    id: "00000004-b910-4f6e-8f3c-8201c1111111",
                  },
                  id: "00000004-b910-4f6e-8f3c-8201c0000000",
                },
              },
              {
                target: 0.34,
                categoryValue: {
                  category: {
                    id: "00000004-b910-4f6e-8f3c-8201c1111111",
                  },
                  id: "00000004-b910-4f6e-8f3c-8201c0000001",
                },
              },
              {
                target: 0.33,
                categoryValue: {
                  category: {
                    id: "00000004-b910-4f6e-8f3c-8201c1111111",
                  },
                  id: "00000004-b910-4f6e-8f3c-8201c0000002",
                },
              },
            ],
          },
        },
      },
      result: {
        data: { createProgram: { id: "foo" } },
      },
    },
  ];

  render(
    <MockedProvider mocks={apolloMocks}>
      <MemoryRouter>
        <ProgramList />
      </MemoryRouter>
    </MockedProvider>
  );

  await tick();

  const createButton = screen.getByRole("button", { name: /index.add/ });
  fireEvent.click(createButton);

  const saveButton = screen.getByRole("button", { name: /save/ });
  expect(saveButton).toBeInTheDocument();

  fireEvent.change(screen.getByRole("textbox", { name: /name/ }), {
    target: { value: "new program" },
  });

  // Assign team
  const teamBox = screen.getByRole("combobox", { name: /team/ });
  userEvent.type(teamBox, "T");
  await tick();
  expect(screen.getByRole("option", { name: /Team1/ })).toBeInTheDocument();
  fireEvent.keyDown(teamBox, {
    key: "enter",
    code: 13,
    charCode: 13,
    keyCode: 13,
  });
  await tick();

  // Assign template
  const progBox = screen.getByRole("combobox", { name: /based/ });
  userEvent.type(progBox, "Other");
  await tick();
  expect(screen.getByRole("option", { name: /Other/ })).toBeInTheDocument();
  fireEvent.keyDown(progBox, {
    key: "enter",
    code: 13,
    charCode: 13,
    keyCode: 13,
  });
  await tick();

  // Now form can be saved
  fireEvent.click(saveButton);
  // One tick for form validation
  await tick();
  // Another tick for GraphQL response
  await tick();
  // If there's no error here everything went well!
  expect(screen.queryByText(/saveError/)).not.toBeInTheDocument();
});
