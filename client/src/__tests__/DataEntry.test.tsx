import { act, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import React from "react";
import { createMemoryHistory } from "history";
import { Router, useParams } from "react-router-dom";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import userEvent from "@testing-library/user-event";
import { autoMockedClient } from "../__mocks__/AutoMockProvider";
import { GraphQLError } from "graphql";
import { ApolloProvider } from "@apollo/client";
import { DataEntry } from "../components/DataEntry/DataEntry";
import MockDate from "mockdate";

const history = createMemoryHistory();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
}));

i18next.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en-gb",
  interpolation: {
    escapeValue: false,
  },
  keySeparator: false,
  resources: {
    "en-gb": {
      translation: {
        addMoreData: "Add More Data",
        goToDataset: "Go to Dataset",
        saveRecord: "{{buttonTitle}} Record",
        cancelAndReturnToDashBoard: "Cancel and Return To Dashboard",
      },
    },
    en: {
      addMoreData: "Add More Data",
      goToDataset: "Go to Dataset",
      saveRecord: "{{buttonTitle}} Record",
      cancelAndReturnToDashBoard: "Cancel and Return To Dashboard",
    },
  },
  lowerCaseLng: true,
});

async function wait(ms = 0) {
  await act(async () => {
    return await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  });
}

test("should load and return error if dataset query fails", async () => {
  (useParams as jest.Mock).mockReturnValue({
    datasetId: "5a8ee1d5-2b5a-49db-b466-68fe50a27cdb",
  });

  const resolvers = {
    Query: () => ({
      dataset: () => new GraphQLError("something unexpected happened"),
    }),
  };

  const client = autoMockedClient(resolvers);

  render(
    <ApolloProvider client={client}>
      <Router history={history}>
        <DataEntry />
      </Router>
    </ApolloProvider>
  );

  expect(screen.getByText(/Loading data.../i)).toBeInTheDocument();

  await wait();

  expect(
    screen.getByText(/Error loading data. Please refresh and try again/i)
  ).toBeInTheDocument();
});

test("should render add entry form with today's date when a record id does not exist in route params", async () => {
  (useParams as jest.Mock).mockReturnValue({
    datasetId: "5a8ee1d5-2b5a-49db-b466-68fe50a27cdb",
  });

  // Sets a fixed date of Sunday, 14 June 2015 22:12:05.275
  // (2015-06-14)
  MockDate.set(1434319925275);

  const client = autoMockedClient();

  render(
    <ApolloProvider client={client}>
      <Router history={history}>
        <DataEntry />
      </Router>
    </ApolloProvider>
  );

  await wait();

  expect(
    screen.getByRole("heading", {
      name: /Add record for BBC News | Breakfast Hour/i,
    })
  );

  expect(screen.getByRole("form"));
  expect(
    screen.getByLabelText("publicationDate", {
      selector: "input",
    })
  ).toHaveValue("2015-06-14");

  expect(screen.getAllByRole("textbox")).toHaveLength(6);

  screen.getByRole("textbox", { name: "men" });
  screen.getByRole("textbox", { name: "women" });
  screen.getByRole("textbox", { name: "cisgender" });
  screen.getByRole("textbox", { name: "transgender" });
  screen.getByRole("textbox", { name: "non-binary" });

  screen.getByRole("button", { name: /Save Record/i });
  screen.getByRole("button", { name: /Save and Add Another Record/i });
  screen.getByRole("button", {
    name: /Cancel and Return To Dashboard/i,
  });

  // Reset fixed date
  MockDate.reset();
});

test("should render edit entry form with record's date when a record id exists in route params", async () => {
  (useParams as jest.Mock).mockReturnValue({
    datasetId: "5a8ee1d5-2b5a-49db-b466-68fe50a27cdb",
    recordId: "05caae8d-bb1a-416e-9dda-bb251fe474ff",
  });

  const client = autoMockedClient();

  render(
    <ApolloProvider client={client}>
      <Router history={history}>
        <DataEntry />
      </Router>
    </ApolloProvider>
  );

  await wait();

  expect(
    screen.getByRole("heading", {
      name: /Edit record for BBC News | Breakfast Hour/i,
    })
  );

  expect(screen.getByRole("form"));
  expect(
    screen.getByLabelText("publicationDate", {
      selector: "input",
    })
  ).toHaveValue("2020-12-20");

  expect(screen.getAllByRole("textbox")).toHaveLength(6);

  screen.getByRole("button", { name: /Update Record/i });
  screen.getByRole("button", {
    name: /Cancel and Return To Dashboard/i,
  });
});

test("should render success screen if on click 'save record' is successful", async () => {
  (useParams as jest.Mock).mockReturnValue({
    datasetId: "5a8ee1d5-2b5a-49db-b466-68fe50a27cdb",
  });

  const client = autoMockedClient();

  render(
    <ApolloProvider client={client}>
      <Router history={history}>
        <DataEntry />
      </Router>
    </ApolloProvider>
  );

  await wait();

  const saveButton = screen.getByRole("button", { name: /Save Record/i });
  userEvent.click(saveButton);

  await waitFor(() => {
    expect(
      screen.getByText(
        /Data has been saved succesfully for BBC News | Breakfast Hour/i
      )
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Add More Data/i }));
  });
});

test("should render success message and stay on screen if on click 'save and add another' is successful", async () => {
  (useParams as jest.Mock).mockReturnValue({
    datasetId: "5a8ee1d5-2b5a-49db-b466-68fe50a27cdb",
  });

  const client = autoMockedClient();

  render(
    <ApolloProvider client={client}>
      <Router history={history}>
        <DataEntry />
      </Router>
    </ApolloProvider>
  );

  await wait();

  const saveButton = screen.getByRole("button", {
    name: /save and add another/i,
  });
  userEvent.click(saveButton);

  await waitFor(() => {
    expect(
      screen.getByText(/Success! Your new record has been saved/i)
    ).toBeInTheDocument();
  });
});

test("should render error alert if saving a new record is not successful", async () => {
  (useParams as jest.Mock).mockReturnValue({
    datasetId: "5a8ee1d5-2b5a-49db-b466-68fe50a27cdb",
  });

  const mock = {
    Mutation: () => ({
      createRecord: () => new Error("An error occurred"),
    }),
  };

  const client = autoMockedClient(mock);

  render(
    <ApolloProvider client={client}>
      <Router history={history}>
        <DataEntry />
      </Router>
    </ApolloProvider>
  );

  await wait();

  const saveButton = screen.getByRole("button", { name: /Save Record/i });
  userEvent.click(saveButton);

  await waitFor(() => {
    expect(screen.getByRole("alert")).toHaveTextContent(
      /Oh, no! Something went wrong/i
    );
  });
});

test("should render success screen if updating an existing record is successful", async () => {
  (useParams as jest.Mock).mockReturnValue({
    datasetId: "5a8ee1d5-2b5a-49db-b466-68fe50a27cdb",
    recordId: "05caae8d-bb1a-416e-9dda-bb251fe474ff",
  });
  const client = autoMockedClient();

  render(
    <ApolloProvider client={client}>
      <Router history={history}>
        <DataEntry />
      </Router>
    </ApolloProvider>
  );

  await wait();

  const saveButton = screen.getByRole("button", { name: /Update Record/i });
  userEvent.click(saveButton);

  await waitFor(() => {
    expect(
      screen.getByText(
        /Data has been saved succesfully for BBC News | Breakfast Hour/i
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: /Add More Data/i })
    ).not.toBeInTheDocument();
  });
});

test("should render error alert if updating an existing record is not successful", async () => {
  (useParams as jest.Mock).mockReturnValue({
    datasetId: "5a8ee1d5-2b5a-49db-b466-68fe50a27cdb",
    recordId: "05caae8d-bb1a-416e-9dda-bb251fe474ff",
  });

  const mock = {
    Mutation: () => ({
      updateRecord: () => new Error("An error occurred"),
    }),
  };

  const client = autoMockedClient(mock);

  render(
    <ApolloProvider client={client}>
      <Router history={history}>
        <DataEntry />
      </Router>
    </ApolloProvider>
  );

  await wait();

  const saveButton = screen.getByRole("button", { name: /Update Record/i });
  userEvent.click(saveButton);

  await waitFor(() => {
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Oh, no! Something went wrong"
    );
  });
});

test("should return to dashboard on click 'cancel and return to dashboard'", async () => {
  (useParams as jest.Mock).mockReturnValue({
    datasetId: "5a8ee1d5-2b5a-49db-b466-68fe50a27cdb",
    recordId: "05caae8d-bb1a-416e-9dda-bb251fe474ff",
  });

  const client = autoMockedClient();

  render(
    <ApolloProvider client={client}>
      <Router history={history}>
        <DataEntry />
      </Router>
    </ApolloProvider>
  );

  await wait();

  const returnButton = screen.getByRole("button", {
    name: /Cancel and Return To Dashboard/i,
  });
  userEvent.click(returnButton);

  await waitFor(() => {
    expect(history.location.pathname).toBe("/");
  });
});