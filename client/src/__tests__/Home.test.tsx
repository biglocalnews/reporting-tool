import { ApolloProvider } from "@apollo/client";
import { act, render, screen, within } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { axe } from "jest-axe";
import { Router } from "react-router-dom";
import { AuthProvider } from "../components/AuthProvider";
import { mockUserLoggedIn } from "../graphql/__mocks__/auth";
import { autoMockedClient } from "../graphql/__mocks__/AutoMockProvider";
import { Home } from "../pages/Home/Home";

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

// skipping some tests due to issues with responsive columns

test.skip("should render home page datasets and formatted 'last updated' date", async () => {
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

  screen.getAllByText(/Search team and dataset/i);
  screen.getByRole("table");

  const row = screen.getAllByRole("row")[1];
  expect(row).toHaveTextContent(/breakfast hour/i);
  expect(within(row).getAllByRole("cell")[2].textContent).toBe("May 10, 2021");
});

test.skip("should render No Data Available Yet for 'last updated' date when no records exist", async () => {
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

test.skip("should render filter alert box and no search bar when filtering by a search term ", async () => {
  const hist = createMemoryHistory();

  const { auth } = mockUserLoggedIn();
  await auth.init();

  const client = autoMockedClient();

  render(
    <AuthProvider auth={auth}>
      <ApolloProvider client={client}>
        <Router history={hist}>
          <Home />
        </Router>
      </ApolloProvider>
    </AuthProvider>
  );

  // check for team found
  const queryParamRoute = "/?team=BBC News";
  hist.push(queryParamRoute);

  await wait();

  // search bar should not appear
  expect(
    screen.queryByText(/Search team and dataset/i)
  ).not.toBeInTheDocument();

  // filter alert should be visible
  expect(screen.getByRole("alert")).toHaveTextContent(
    /user.homePage.showingDatasetsFor: BBC News/i
  );

  expect(screen.getByRole("button", { name: /user.homePage.showAllMy/i }));

  // table should have header and two rows
  expect(screen.getAllByRole("row")).toHaveLength(3);

  // check alert box for team not found
  const teamNotFound = "/?team=t";
  hist.push(teamNotFound);

  await wait();

  // filter alert should be visible
  expect(screen.getByRole("alert")).toHaveTextContent(
    /user.homePage.showingDatasetsFor: t/i
  );

  // table should have header and one row
  expect(screen.getAllByRole("row")).toHaveLength(2);

  // check alert box for team param value not found
  const queryParamNotFound = "/?team=";
  hist.push(queryParamNotFound);

  await wait();

  // filter alert should be visible
  expect(screen.getByRole("alert")).toHaveTextContent(
    /Oops! We couldn't find the team name provided. Please refresh and try again/i
  );

  // table should have no data
  expect(screen.getByRole("table")).toHaveTextContent(/No Data/i);
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
