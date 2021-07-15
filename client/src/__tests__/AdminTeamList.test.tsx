import { MockedProvider } from "@apollo/client/testing";
import "@testing-library/jest-dom/extend-expect";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ADMIN_CREATE_TEAM } from "../graphql/__mutations__/AdminCreateTeam.gql";
import { ADMIN_GET_ALL_ORGS } from "../graphql/__queries__/AdminGetAllOrgs.gql";
import { ADMIN_GET_ALL_PROGRAMS } from "../graphql/__queries__/AdminGetAllPrograms.gql";
import { ADMIN_GET_ALL_TEAMS } from "../graphql/__queries__/AdminGetAllTeams.gql";
import { GET_USER_LIST } from "../graphql/__queries__/GetUserList.gql";
import { TeamList } from "../pages/Admin/TeamList";
import { PROGRAMS, TEAMS, USERS } from "./fixtures";
import { tick } from "./utils";

it("renders list of programs for the admin to manage", async () => {
  const apolloMocks = [
    {
      request: { query: ADMIN_GET_ALL_TEAMS },
      result: TEAMS,
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
      request: { query: ADMIN_GET_ALL_ORGS },
      result: {
        data: {
          organizations: [
            {
              id: "15d89a19-b78d-4ee8-b321-043f26bdd48a",
              name: "My Org",
            },
          ],
        },
      },
    },
  ];

  render(
    <MockedProvider mocks={apolloMocks}>
      <MemoryRouter>
        <TeamList />
      </MemoryRouter>
    </MockedProvider>
  );

  await tick();

  expect(screen.getAllByRole("row")).toHaveLength(3);
  expect(screen.getByText("Team1")).toBeInTheDocument();
  expect(screen.getByText("Team2")).toBeInTheDocument();
  const team2Row = screen.getAllByRole("row")[2];
  const cells = team2Row.querySelectorAll("td");
  expect(cells[1]).toHaveTextContent("3");
  expect(cells[2]).toHaveTextContent("2");
});

it("lets admin create a new team", async () => {
  const apolloMocks = [
    {
      request: { query: ADMIN_GET_ALL_TEAMS },
      result: TEAMS,
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
      request: { query: ADMIN_GET_ALL_ORGS },
      result: {
        data: {
          organizations: [
            {
              id: "15d89a19-b78d-4ee8-b321-043f26bdd48a",
              name: "My Org",
            },
          ],
        },
      },
    },
    {
      request: {
        query: ADMIN_CREATE_TEAM,
        variables: {
          input: {
            name: "my team",
            organizationId: "15d89a19-b78d-4ee8-b321-043f26bdd48a",
          },
        },
      },
      result: {
        data: {
          createTeam: {
            id: "vvvvvvv9-b78d-4ee8-b321-043f26bdd48a",
          },
        },
      },
    },
  ];

  render(
    <MockedProvider mocks={apolloMocks}>
      <MemoryRouter>
        <TeamList />
      </MemoryRouter>
    </MockedProvider>
  );

  await tick();

  fireEvent.click(screen.getByRole("button", { name: /create/ }));

  await tick();

  fireEvent.click(screen.getByRole("button", { name: /save/ }));

  await tick();

  fireEvent.change(screen.getByRole("textbox", { name: /name/ }), {
    target: { value: "my team" },
  });

  await tick();

  fireEvent.click(screen.getByRole("button", { name: /save/ }));

  // validation
  await tick();

  // network request
  await tick();

  expect(screen.queryByText(/createTeamError/)).not.toBeInTheDocument();
});
