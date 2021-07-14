import { MockedProvider } from "@apollo/client/testing";
import "@testing-library/jest-dom/extend-expect";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route } from "react-router-dom";
import { UserAccountManagerProvider } from "../components/UserAccountManagerProvider";
import { ADMIN_GET_ALL_ROLES } from "../graphql/__queries__/AdminGetAllRoles.gql";
import { ADMIN_GET_ALL_TEAMS } from "../graphql/__queries__/AdminGetAllTeams.gql";
import { ADMIN_GET_USER } from "../graphql/__queries__/AdminGetUser.gql";
import { EditUser } from "../pages/Admin/EditUser";
import { mockUserAccountClient, tick } from "./utils";

const allRolesMock = {
  request: { query: ADMIN_GET_ALL_ROLES },
  result: {
    data: {
      roles: [
        {
          id: "be5f8cac-ac65-4f75-8052-8d1b5d40dffe",
          name: "admin",
          description: "User is an admin and has administrative privileges",
        },
      ],
    },
  },
};

const allTeamsMock = {
  request: { query: ADMIN_GET_ALL_TEAMS },
  result: {
    data: {
      teams: [
        {
          id: "472d17da-ff8b-4743-823f-3f01ea21a349",
          name: "News Team",
        },
      ],
    },
  },
};

const normalUserMock = {
  request: {
    query: ADMIN_GET_USER,
    variables: {
      id: "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
    },
  },
  result: {
    data: {
      user: {
        email: "tester@notrealemail.info",
        firstName: "Cat",
        lastName: "Berry",
        active: true,
        teams: [
          {
            id: "472d17da-ff8b-4743-823f-3f01ea21a349",
            name: "News Team",
          },
        ],
        roles: [],
      },
    },
  },
};

it("renders a user for editing", async () => {
  const apolloMocks = [normalUserMock, allTeamsMock, allRolesMock];

  render(
    <MockedProvider mocks={apolloMocks}>
      <UserAccountManagerProvider value={mockUserAccountClient}>
        <MemoryRouter
          initialEntries={["/cd7e6d44-4b4d-4d7a-8a67-31efffe53e77"]}
        >
          <Route path="/:userId">
            <EditUser />
          </Route>
        </MemoryRouter>
      </UserAccountManagerProvider>
    </MockedProvider>
  );

  await tick();
  expect(screen.getByRole("textbox", { name: /firstName/i })).toHaveValue(
    "Cat"
  );
  expect(screen.getByRole("textbox", { name: /lastName/i })).toHaveValue(
    "Berry"
  );
  expect(screen.getByRole("textbox", { name: /email/i })).toHaveValue(
    "tester@notrealemail.info"
  );
  expect(screen.getByText(/News Team/)).toBeInTheDocument();
  expect(screen.getByRole("checkbox", { name: /admin/i })).not.toBeChecked();
});

it("renders a user with disabled form fields if they are inactive, allows admin to restore", async () => {
  const disabledUserMock = JSON.parse(JSON.stringify(normalUserMock));
  disabledUserMock.result.data.user.active = false;
  const apolloMocks = [
    // Initial calls for inactive user
    disabledUserMock,
    allTeamsMock,
    allRolesMock,
    // Responses for "refresh" call when restoring user
    normalUserMock,
    allTeamsMock,
    allRolesMock,
  ];

  render(
    <MockedProvider mocks={apolloMocks}>
      <UserAccountManagerProvider value={mockUserAccountClient}>
        <MemoryRouter
          initialEntries={["/cd7e6d44-4b4d-4d7a-8a67-31efffe53e77"]}
        >
          <Route path="/:userId">
            <EditUser />
          </Route>
        </MemoryRouter>
      </UserAccountManagerProvider>
    </MockedProvider>
  );

  await tick();
  expect(screen.getByRole("textbox", { name: /firstName/i })).toBeDisabled();
  expect(screen.getByRole("textbox", { name: /lastName/i })).toBeDisabled();
  expect(screen.getByRole("textbox", { name: /email/i })).toBeDisabled();
  expect(screen.getByRole("checkbox", { name: /admin/i })).toBeDisabled();
  expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
  expect(screen.getByRole("button", { name: /delete/i })).toBeDisabled();

  const restoreBtn = screen.getByRole("button", { name: /restore/i });
  expect(restoreBtn).not.toBeDisabled();

  fireEvent.click(restoreBtn);
  expect(mockUserAccountClient.restoreUser).toHaveBeenCalledTimes(1);
  expect(mockUserAccountClient.restoreUser).toHaveBeenCalledWith(
    "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77"
  );
  await tick();

  expect(
    screen.getByRole("textbox", { name: /firstName/i })
  ).not.toBeDisabled();
  expect(screen.getByRole("textbox", { name: /lastName/i })).not.toBeDisabled();
  expect(screen.getByRole("textbox", { name: /email/i })).not.toBeDisabled();
  expect(screen.getByRole("checkbox", { name: /admin/i })).not.toBeDisabled();
  expect(screen.getByRole("button", { name: /save/i })).not.toBeDisabled();
  expect(screen.getByRole("button", { name: /delete/i })).not.toBeDisabled();
});

it("allows admin to modify user", async () => {
  const apolloMocks = [normalUserMock, allTeamsMock, allRolesMock];

  render(
    <MockedProvider mocks={apolloMocks}>
      <UserAccountManagerProvider value={mockUserAccountClient}>
        <MemoryRouter
          initialEntries={["/cd7e6d44-4b4d-4d7a-8a67-31efffe53e77"]}
        >
          <Route path="/:userId">
            <EditUser />
          </Route>
        </MemoryRouter>
      </UserAccountManagerProvider>
    </MockedProvider>
  );

  await tick();
  fireEvent.click(screen.getByRole("checkbox", { name: /admin/i }));
  await tick();
  fireEvent.click(screen.getByRole("button", { name: /save/i }));
  await tick();

  expect(mockUserAccountClient.editUser).toHaveBeenCalledTimes(1);
  expect(mockUserAccountClient.editUser).toHaveBeenCalledWith(
    "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
    {
      first_name: "Cat",
      last_name: "Berry",
      email: "tester@notrealemail.info",
      roles: ["be5f8cac-ac65-4f75-8052-8d1b5d40dffe"],
      teams: ["472d17da-ff8b-4743-823f-3f01ea21a349"],
    }
  );
});

it("allows admin to disable user", async () => {
  const disabledUserMock = JSON.parse(JSON.stringify(normalUserMock));
  disabledUserMock.result.data.user.active = false;
  const apolloMocks = [
    normalUserMock,
    allTeamsMock,
    allRolesMock,
    // after refresh
    disabledUserMock,
    allTeamsMock,
    allRolesMock,
  ];

  render(
    <MockedProvider mocks={apolloMocks}>
      <UserAccountManagerProvider value={mockUserAccountClient}>
        <MemoryRouter
          initialEntries={["/cd7e6d44-4b4d-4d7a-8a67-31efffe53e77"]}
        >
          <Route path="/:userId">
            <EditUser />
          </Route>
        </MemoryRouter>
      </UserAccountManagerProvider>
    </MockedProvider>
  );

  await tick();

  // Click to delete
  fireEvent.click(screen.getByRole("button", { name: /delete/i }));

  await tick();

  // click through the confirmation modal
  fireEvent.click(screen.getByRole("button", { name: /ok/i }));

  await tick();

  // Verify the UI was refreshed and the request was sent.
  expect(screen.getByRole("button", { name: /restore/ })).toBeInTheDocument();
  expect(mockUserAccountClient.deleteUser).toHaveBeenCalledTimes(1);
  expect(mockUserAccountClient.deleteUser).toHaveBeenCalledWith(
    "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77"
  );
});
