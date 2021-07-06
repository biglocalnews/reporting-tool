import { act, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import React from "react";
import { Router } from "react-router-dom";
import { createMemoryHistory } from "history";
import { ApolloProvider } from "@apollo/client";

import { UserAccountManagerProvider } from "../components/UserAccountManagerProvider";
import { mockUserLoggedIn } from "../graphql/__mocks__/auth";
import { autoMockedClient } from "../graphql/__mocks__/AutoMockProvider";

import { UserList } from "../pages/Admin/UserList";

it("Renders list of users for the admin", async () => {
  const resolvers = {
    Query: () => ({
      users: () => [],
    }),
  };
  const { auth } = mockUserLoggedIn({
    roles: [{ name: "admin", description: "" }],
  });
  await auth.init();

  const history = createMemoryHistory();
  const apolloClient = autoMockedClient(resolvers);

  render(
    <ApolloProvider client={apolloClient}>
      <UserAccountManagerProvider value={{}}>
        <Router history={history}>
          <UserList />
        </Router>
      </UserAccountManagerProvider>
    </ApolloProvider>
  );
});
