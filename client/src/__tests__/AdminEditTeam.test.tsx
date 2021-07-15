import { MockedProvider } from "@apollo/client/testing";
import "@testing-library/jest-dom/extend-expect";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route } from "react-router-dom";
import { ADMIN_DELETE_TEAM } from "../graphql/__mutations__/AdminDeleteTeam.gql";
import { ADMIN_UPDATE_TEAM } from "../graphql/__mutations__/AdminUpdateTeam.gql";
import { ADMIN_GET_ALL_PROGRAMS } from "../graphql/__queries__/AdminGetAllPrograms.gql";
import { ADMIN_GET_TEAM } from "../graphql/__queries__/AdminGetTeam.gql";
import { GET_USER_LIST } from "../graphql/__queries__/GetUserList.gql";
import { EditTeam } from "../pages/Admin/EditTeam";
import { PROGRAMS, USERS } from "./fixtures";
import { tick } from "./utils";

const TEAM = {
  data: {
    team: {
      name: "News Team",
      users: USERS.data.users.map(({ id }) => ({ id })),
      programs: PROGRAMS.data.programs.map(({ id }) => ({ id })),
    },
  },
};

it("renders current name and can edit it", async () => {
  const apolloMocks = [
    {
      request: {
        query: ADMIN_GET_TEAM,
        variables: {
          id: "472d17da-ff8b-4743-823f-3f01ea21a349",
        },
      },
      result: TEAM,
    },
    {
      request: { query: ADMIN_GET_ALL_PROGRAMS },
      result: PROGRAMS,
    },
    {
      request: { query: GET_USER_LIST },
      result: USERS,
    },
    {
      request: {
        query: ADMIN_UPDATE_TEAM,
        variables: {
          input: {
            id: "472d17da-ff8b-4743-823f-3f01ea21a349",
            name: "new name",
            userIds: [
              "df6413b4-b910-4f6e-8f3c-8201c9e65af3",
              "a47085ba-3d01-46a4-963b-9ffaeda18113",
              "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
            ],
            programIds: [
              "zzzzz3b4-b910-4f6e-8f3c-8201c9e00000",
              "bbbbb3b4-b910-4f6e-8f3c-8201c9e00000",
            ],
          },
        },
      },
      result: {
        data: {
          id: "472d17da-ff8b-4743-823f-3f01ea21a349",
        },
      },
    },
    {
      request: {
        query: ADMIN_GET_TEAM,
        variables: {
          id: "472d17da-ff8b-4743-823f-3f01ea21a349",
        },
      },
      result: TEAM,
    },
    {
      request: { query: ADMIN_GET_ALL_PROGRAMS },
      result: PROGRAMS,
    },
    {
      request: { query: GET_USER_LIST },
      result: USERS,
    },
  ];

  render(
    <MockedProvider mocks={apolloMocks}>
      <MemoryRouter initialEntries={["/472d17da-ff8b-4743-823f-3f01ea21a349"]}>
        <Route path="/:teamId">
          <EditTeam />
        </Route>
      </MemoryRouter>
    </MockedProvider>
  );

  await tick();

  expect(screen.getByRole("button", { name: /submit/ })).toBeDisabled();
  expect(screen.getByRole("button", { name: /delete/ })).not.toBeDisabled();

  const nameBox = screen.getByRole("textbox", { name: /name/ });
  expect(nameBox).toHaveValue("News Team");

  fireEvent.change(nameBox, { target: { value: "" } });
  await tick();

  expect(screen.getByRole("button", { name: /submit/ })).not.toBeDisabled();
  expect(screen.getByRole("button", { name: /delete/ })).toBeDisabled();

  const submit = screen.getByRole("button", { name: /submit/ });
  fireEvent.click(submit);
  await tick();

  // Missing required name shouldn't submit
  expect(
    document.querySelector(".ant-form-item-has-error")
  ).toBeInTheDocument();

  fireEvent.change(nameBox, { target: { value: "new name" } });
  await tick();

  fireEvent.click(submit);

  // Form validation tick
  await tick();

  // Network request tick
  await tick();

  expect(screen.queryByText(/saveTeamError/)).not.toBeInTheDocument();

  await tick();

  expect(screen.getByRole("button", { name: /submit/ })).toBeDisabled();
  expect(screen.getByRole("button", { name: /delete/ })).not.toBeDisabled();
});

it("lets user edit users on team", async () => {
  const apolloMocks = [
    {
      request: {
        query: ADMIN_GET_TEAM,
        variables: {
          id: "472d17da-ff8b-4743-823f-3f01ea21a349",
        },
      },
      result: TEAM,
    },
    {
      request: { query: ADMIN_GET_ALL_PROGRAMS },
      result: PROGRAMS,
    },
    {
      request: { query: GET_USER_LIST },
      result: USERS,
    },
    {
      request: {
        query: ADMIN_UPDATE_TEAM,
        variables: {
          input: {
            id: "472d17da-ff8b-4743-823f-3f01ea21a349",
            name: "News Team",
            userIds: [
              "df6413b4-b910-4f6e-8f3c-8201c9e65af3",
              "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
            ],
            programIds: [
              "zzzzz3b4-b910-4f6e-8f3c-8201c9e00000",
              "bbbbb3b4-b910-4f6e-8f3c-8201c9e00000",
            ],
          },
        },
      },
      result: {
        data: {
          id: "472d17da-ff8b-4743-823f-3f01ea21a349",
        },
      },
    },
    {
      request: {
        query: ADMIN_GET_TEAM,
        variables: {
          id: "472d17da-ff8b-4743-823f-3f01ea21a349",
        },
      },
      result: TEAM,
    },
    {
      request: { query: ADMIN_GET_ALL_PROGRAMS },
      result: PROGRAMS,
    },
    {
      request: { query: GET_USER_LIST },
      result: USERS,
    },
  ];

  render(
    <MockedProvider mocks={apolloMocks}>
      <MemoryRouter initialEntries={["/472d17da-ff8b-4743-823f-3f01ea21a349"]}>
        <Route path="/:teamId">
          <EditTeam />
        </Route>
      </MemoryRouter>
    </MockedProvider>
  );

  await tick();

  fireEvent.click(screen.getByText(/Penelope/));

  await tick();

  fireEvent.click(screen.getAllByRole("button", { name: /remove/ })[0]);

  await tick();

  expect(screen.getByRole("button", { name: /submit/ })).not.toBeDisabled();
  expect(screen.getByRole("button", { name: /delete/ })).toBeDisabled();

  fireEvent.click(screen.getByRole("button", { name: /submit/ }));

  // Form validation tick
  await tick();

  // Network request tick
  await tick();

  expect(screen.queryByText(/saveTeamError/)).not.toBeInTheDocument();

  await tick();

  expect(screen.getByRole("button", { name: /submit/ })).toBeDisabled();
  expect(screen.getByRole("button", { name: /delete/ })).not.toBeDisabled();
});

it("lets user edit programs assigned to the team", async () => {
  const apolloMocks = [
    {
      request: {
        query: ADMIN_GET_TEAM,
        variables: {
          id: "472d17da-ff8b-4743-823f-3f01ea21a349",
        },
      },
      result: TEAM,
    },
    {
      request: { query: ADMIN_GET_ALL_PROGRAMS },
      result: PROGRAMS,
    },
    {
      request: { query: GET_USER_LIST },
      result: USERS,
    },
    {
      request: {
        query: ADMIN_UPDATE_TEAM,
        variables: {
          input: {
            id: "472d17da-ff8b-4743-823f-3f01ea21a349",
            name: "News Team",
            userIds: [
              "df6413b4-b910-4f6e-8f3c-8201c9e65af3",
              "a47085ba-3d01-46a4-963b-9ffaeda18113",
              "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
            ],
            programIds: ["zzzzz3b4-b910-4f6e-8f3c-8201c9e00000"],
          },
        },
      },
      result: {
        data: {
          id: "472d17da-ff8b-4743-823f-3f01ea21a349",
        },
      },
    },
    {
      request: {
        query: ADMIN_GET_TEAM,
        variables: {
          id: "472d17da-ff8b-4743-823f-3f01ea21a349",
        },
      },
      result: TEAM,
    },
    {
      request: { query: ADMIN_GET_ALL_PROGRAMS },
      result: PROGRAMS,
    },
    {
      request: { query: GET_USER_LIST },
      result: USERS,
    },
  ];

  render(
    <MockedProvider mocks={apolloMocks}>
      <MemoryRouter initialEntries={["/472d17da-ff8b-4743-823f-3f01ea21a349"]}>
        <Route path="/:teamId">
          <EditTeam />
        </Route>
      </MemoryRouter>
    </MockedProvider>
  );

  await tick();

  fireEvent.click(screen.getByText(/Other Program/));

  await tick();

  fireEvent.click(screen.getAllByRole("button", { name: /remove/ })[1]);

  await tick();

  expect(screen.getByRole("button", { name: /submit/ })).not.toBeDisabled();
  expect(screen.getByRole("button", { name: /delete/ })).toBeDisabled();

  fireEvent.click(screen.getByRole("button", { name: /submit/ }));

  // Form validation tick
  await tick();

  // Network request tick
  await tick();

  expect(screen.queryByText(/saveTeamError/)).not.toBeInTheDocument();

  await tick();

  expect(screen.getByRole("button", { name: /submit/ })).toBeDisabled();
  expect(screen.getByRole("button", { name: /delete/ })).not.toBeDisabled();
});

it("allows admin to delete a team if it's empty and unchanged", async () => {
  const emptyTeam = JSON.parse(JSON.stringify(TEAM));
  emptyTeam.data.team.programs = [];
  emptyTeam.data.team.users = [];
  const apolloMocks = [
    {
      request: {
        query: ADMIN_GET_TEAM,
        variables: {
          id: "472d17da-ff8b-4743-823f-3f01ea21a349",
        },
      },
      result: emptyTeam,
    },
    {
      request: { query: ADMIN_GET_ALL_PROGRAMS },
      result: PROGRAMS,
    },
    {
      request: { query: GET_USER_LIST },
      result: USERS,
    },
    {
      request: {
        query: ADMIN_DELETE_TEAM,
        variables: {
          id: "472d17da-ff8b-4743-823f-3f01ea21a349",
        },
      },
      result: {
        data: {
          deleteTeam: "472d17da-ff8b-4743-823f-3f01ea21a349",
        },
      },
    },
  ];

  render(
    <MockedProvider mocks={apolloMocks}>
      <MemoryRouter
        initialEntries={["/admin/teams/472d17da-ff8b-4743-823f-3f01ea21a349"]}
      >
        <Route path="/admin/teams/:teamId">
          <EditTeam />
        </Route>
      </MemoryRouter>
    </MockedProvider>
  );

  await tick();

  fireEvent.click(screen.getByRole("button", { name: /delete/ }));

  await tick();

  fireEvent.click(screen.getByRole("button", { name: /confirm.yes/ }));

  await tick();

  expect(screen.queryByText(/Error/)).not.toBeInTheDocument();
  expect(document.querySelector(".ant-message-error")).not.toBeInTheDocument();
  expect(document.querySelector(".ant-message-success")).toBeInTheDocument();
});

it("does not allow admins to delete team if it has users or programs", async () => {
  const apolloMocks = [
    {
      request: {
        query: ADMIN_GET_TEAM,
        variables: {
          id: "472d17da-ff8b-4743-823f-3f01ea21a349",
        },
      },
      result: TEAM,
    },
    {
      request: { query: ADMIN_GET_ALL_PROGRAMS },
      result: PROGRAMS,
    },
    {
      request: { query: GET_USER_LIST },
      result: USERS,
    },
    {
      request: {
        query: ADMIN_DELETE_TEAM,
        variables: {
          id: "472d17da-ff8b-4743-823f-3f01ea21a349",
        },
      },
      result: {
        data: {
          deleteTeam: "472d17da-ff8b-4743-823f-3f01ea21a349",
        },
      },
    },
  ];

  render(
    <MockedProvider mocks={apolloMocks}>
      <MemoryRouter initialEntries={["/472d17da-ff8b-4743-823f-3f01ea21a349"]}>
        <Route path="/:teamId">
          <EditTeam />
        </Route>
      </MemoryRouter>
    </MockedProvider>
  );

  await tick();

  fireEvent.click(screen.getByRole("button", { name: /delete/ }));

  await tick();

  fireEvent.click(screen.getByRole("button", { name: /confirm.yes/ }));

  await tick();

  expect(screen.queryByText(/Error/)).not.toBeInTheDocument();
  expect(document.querySelector(".ant-message-error")).toBeInTheDocument();
  expect(
    document.querySelector(".ant-message-success")
  ).not.toBeInTheDocument();
});
