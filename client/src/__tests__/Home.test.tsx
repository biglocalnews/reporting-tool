import React from "react";
import { act, render, screen, within } from "@testing-library/react";
import { Home } from "../components/Home/Home";
import { createMemoryHistory } from "history";
import { ApolloProvider } from "@apollo/client";
import { Router } from "react-router-dom";
import { autoMockedClient } from "../__mocks__/AutoMockProvider";
import { mockUserLoggedIn } from "../__mocks__/auth";
import { AuthProvider } from "../components/AuthProvider";

const history = createMemoryHistory();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
}));

async function wait(ms = 0) {
  await act(async () => {
    return await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  });
}

test("should render home page datasets and formatted 'last updated' date", async () => {
  const { auth, mock } = mockUserLoggedIn();
  await auth.init();

  const mockDateTime = {
    DateTime: () => {
      return "2021-05-10T03:04:59";
    },
  };

  const client = autoMockedClient(mockDateTime);

  render(
    <AuthProvider auth={auth}>
      <ApolloProvider client={client}>
        <Router history={history}>
          <Home />
        </Router>
      </ApolloProvider>
    </AuthProvider>
  );

  await wait();

  screen.getByText(/Search your programs/i);
  screen.getByRole("table");

  const row = screen.getAllByRole("row")[1];
  expect(row).toHaveTextContent(/breakfast hour/i);
  expect(within(row).getAllByRole("cell")[2].textContent).toBe("May 10, 2021");
});

test("should render No Data Available for 'last updated' date when no records exist", async () => {
  const { auth, mock } = mockUserLoggedIn();
  await auth.init();

  const mockDateTime = {
    DateTime: () => {
      return "";
    },
  };

  const client = autoMockedClient(mockDateTime);

  render(
    <AuthProvider auth={auth}>
      <ApolloProvider client={client}>
        <Router history={history}>
          <Home />
        </Router>
      </ApolloProvider>
    </AuthProvider>
  );

  await wait();

  const row = screen.getAllByRole("row")[1];
  expect(row).toHaveTextContent(/breakfast hour/i);
  expect(within(row).getAllByRole("cell")[2].textContent).toBe(
    "No Data Available"
  );
});
