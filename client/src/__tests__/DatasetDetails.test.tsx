import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import React from "react";
import { DatasetDetails } from "../components/DatasetDetails/DatasetDetails";
import { createMemoryHistory } from "history";
import { Router } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { autoMockedClient } from "../__mocks__/AutoMockProvider";
import { GraphQLError } from "graphql";
import { ApolloProvider } from "@apollo/client";

const history = createMemoryHistory();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest
    .fn()
    .mockReturnValue({ datasetId: "5a8ee1d5-2b5a-49db-b466-68fe50a27cdb" }),
}));

async function wait(ms = 0) {
  await act(async () => {
    return await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  });
}

test("should return error to ui if dataset query fails", async () => {
  const resolvers = {
    Query: () => ({
      dataset: () => new GraphQLError("something bad happened"),
    }),
  };

  const client = autoMockedClient(resolvers);

  render(
    <ApolloProvider client={client}>
      <Router history={history}>
        <DatasetDetails />
      </Router>
    </ApolloProvider>
  );

  await wait();

  expect(screen.getByText("Error: something bad happened")).toBeInTheDocument();
});

test("should get dataset records when component is mounted and displays them in a table", async () => {
  const client = autoMockedClient();

  render(
    <ApolloProvider client={client}>
      <Router history={history}>
        <DatasetDetails />
      </Router>
    </ApolloProvider>
  );

  expect(screen).toBeTruthy();
  expect(screen.getByText("Loading")).toBeInTheDocument();

  await wait();

  expect(screen.getByText("BBC News")).toBeInTheDocument();
  expect(screen.getByRole("table"));

  expect(screen.getAllByRole("row")).toHaveLength(1);
});

test("clicking on the add data button should route to the data entry page", async () => {
  const client = autoMockedClient();

  render(
    <ApolloProvider client={client}>
      <Router history={history}>
        <DatasetDetails />
      </Router>
    </ApolloProvider>
  );

  await wait();

  const addDataButton = screen.getByRole("button", { name: "plus Add Data" });
  userEvent.click(addDataButton);

  expect(history.location.pathname).toBe(
    "/dataset/5a8ee1d5-2b5a-49db-b466-68fe50a27cdb/entry"
  );
});

test("should return error to user on delete if delete fails", async () => {
  const mock = {
    Mutation: () => ({
      deleteRecord: () => new Error("An error occurred"),
    }),
  };

  const client = autoMockedClient(mock);

  const { container } = render(
    <ApolloProvider client={client}>
      <Router history={history}>
        <DatasetDetails />
      </Router>
    </ApolloProvider>
  );

  await wait();

  await act(async () => {
    const recordToDelete = container.querySelector(
      "tr[data-row-key='05caae8d-bb1a-416e-9dda-bb251fe474ff']"
    ) as HTMLElement;

    const deleteButtonforRecord = within(recordToDelete).getByRole("button", {
      name: "Delete",
    });
    userEvent.click(deleteButtonforRecord);

    await wait();

    const popConfirmDeleteAction = screen.getByRole("tooltip");
    fireEvent.click(
      within(popConfirmDeleteAction).getByRole("button", {
        name: "Yes, delete",
      })
    );
  });

  expect(
    screen.getByText("An error occurred. Please try again later.")
  ).toBeInTheDocument();
});

test("should go to data entry page when edit button for a record is clicked", async () => {
  const client = autoMockedClient();

  const { container } = render(
    <ApolloProvider client={client}>
      <Router history={history}>
        <DatasetDetails />
      </Router>
    </ApolloProvider>
  );

  await wait();

  await act(async () => {
    const edit = container.querySelector(
      "tr[data-row-key='05caae8d-bb1a-416e-9dda-bb251fe474ff']"
    ) as HTMLElement;

    const editButton = within(edit).getByRole("button", {
      name: "Edit",
    });

    await waitFor(() => userEvent.click(editButton));
  });

  expect(history.location.pathname).toBe(
    "/dataset/5a8ee1d5-2b5a-49db-b466-68fe50a27cdb/entry/edit/05caae8d-bb1a-416e-9dda-bb251fe474ff"
  );
});

test("should delete record from table when delete button is clicked", async () => {
  const client = autoMockedClient();

  const { container } = render(
    <ApolloProvider client={client}>
      <Router history={history}>
        <DatasetDetails />
      </Router>
    </ApolloProvider>
  );

  await wait();

  await act(async () => {
    const recordToDelete = container.querySelector(
      "tr[data-row-key='05caae8d-bb1a-416e-9dda-bb251fe474ff']"
    ) as HTMLElement;

    const deleteButtonforRecord = within(recordToDelete).getByRole("button", {
      name: "Delete",
    });
    userEvent.click(deleteButtonforRecord);

    await wait();

    const popConfirmDeleteAction = screen.getByRole("tooltip");
    fireEvent.click(
      within(popConfirmDeleteAction).getByRole("button", {
        name: "Yes, delete",
      })
    );
  });

  expect(screen.getByText("No Data")).toBeInTheDocument();
});
