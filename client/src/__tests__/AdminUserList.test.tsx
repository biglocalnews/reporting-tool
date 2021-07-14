import { MockedProvider } from "@apollo/client/testing";
import "@testing-library/jest-dom/extend-expect";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { UserAccountManagerProvider } from "../components/UserAccountManagerProvider";
import { GET_USER_LIST } from "../graphql/__queries__/GetUserList.gql";
import { UserList } from "../pages/Admin/UserList";
import { mockUserAccountClient, tick } from "./utils";

it("renders list of users for the admin", async () => {
  const apolloMocks = [
    {
      request: {
        query: GET_USER_LIST,
      },
      result: {
        data: {
          users: [
            {
              id: "df6413b4-b910-4f6e-8f3c-8201c9e65af3",
              firstName: "Daisy",
              lastName: "Carrot",
              active: true,
              email: "admin@notrealemail.info",
              roles: [{ name: "admin", description: "" }],
            },
            {
              id: "a47085ba-3d01-46a4-963b-9ffaeda18113",
              firstName: "Penelope",
              lastName: "Pineapple",
              active: true,
              email: "other@notrealemail.info",
              roles: [],
            },
            {
              id: "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
              firstName: "Cat",
              lastName: "Berry",
              active: true,
              email: "tester@notrealemail.info",
              roles: [],
            },
          ],
        },
      },
    },
  ];

  render(
    <MockedProvider mocks={apolloMocks}>
      <UserAccountManagerProvider value={mockUserAccountClient}>
        <MemoryRouter>
          <UserList />
        </MemoryRouter>
      </UserAccountManagerProvider>
    </MockedProvider>
  );

  await tick();

  expect(screen.getAllByRole("row")).toHaveLength(4);
  expect(screen.getByText("admin@notrealemail.info")).toBeInTheDocument();
  expect(screen.getByText("tester@notrealemail.info")).toBeInTheDocument();
  expect(screen.getByText("other@notrealemail.info")).toBeInTheDocument();
});

it("lets admin create new user", async () => {
  const apolloMocks = [
    {
      request: {
        query: GET_USER_LIST,
      },
      result: {
        data: {
          users: [],
        },
      },
    },
  ];

  render(
    <MockedProvider mocks={apolloMocks}>
      <UserAccountManagerProvider value={mockUserAccountClient}>
        <MemoryRouter>
          <UserList />
        </MemoryRouter>
      </UserAccountManagerProvider>
    </MockedProvider>
  );

  await tick();

  const createButton = screen.getByRole("button", { name: /createNew/ });
  fireEvent.click(createButton);

  const saveButton = screen.getByRole("button", { name: /save/ });
  expect(saveButton).toBeInTheDocument();

  fireEvent.change(screen.getByRole("textbox", { name: /firstName/ }), {
    target: { value: "Bertha" },
  });

  // Incomplete form can't be submitted
  fireEvent.click(saveButton);
  await tick();
  expect(mockUserAccountClient.createUser).toHaveBeenCalledTimes(0);

  // Completed form should save user
  fireEvent.change(screen.getByRole("textbox", { name: /lastName/ }), {
    target: { value: "Marigold" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: /email/ }), {
    target: { value: "bertha@marigold.net" },
  });

  fireEvent.click(saveButton);

  await tick();

  expect(mockUserAccountClient.createUser).toHaveBeenCalledTimes(1);
  expect(mockUserAccountClient.createUser).toHaveBeenCalledWith({
    first_name: "Bertha",
    last_name: "Marigold",
    email: "bertha@marigold.net",
  });
  expect(mockUserAccountClient.requestVerifyUser).toHaveBeenCalledTimes(1);
  expect(mockUserAccountClient.requestVerifyUser).toHaveBeenCalledWith(
    "bertha@marigold.net"
  );
});
