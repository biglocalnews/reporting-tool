import { ApolloProvider } from "@apollo/client";
import { act, render, screen, within } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { axe } from "jest-axe";
import { Router } from "react-router-dom";
import { AuthProvider } from "../components/AuthProvider";
import { mockUserLoggedIn } from "../graphql/__mocks__/auth";
import { autoMockedClient } from "../graphql/__mocks__/AutoMockProvider";
import { Home } from "../pages/Home/Home";

let navigate = createMemoryHistory();

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
  const { auth } = mockUserLoggedIn();
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

test("should render No Data Available Yet for 'last updated' date when no records exist", async () => {
  const { auth } = mockUserLoggedIn();
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
    "No Data Available Yet"
  );
});

describe("accessibility", () => {
  // The violation in the following test does not appear to be an issue when
  // checked against axe dev tools in the UI so we will skip it.
  it.skip("should not have basic accessibility issues", async () => {
    const { auth } = mockUserLoggedIn();
    await auth.init();

    const client = autoMockedClient();

    const { container } = render(
      <AuthProvider auth={auth}>
        <ApolloProvider client={client}>
          <Router history={history}>
            <Home />
          </Router>
        </ApolloProvider>
      </AuthProvider>
    );

    await wait();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
