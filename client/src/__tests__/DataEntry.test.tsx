import { ApolloProvider } from "@apollo/client";
import "@testing-library/jest-dom/extend-expect";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { createMemoryHistory } from "history";
import MockDate from "mockdate";
import { Router, useParams } from "react-router-dom";
import { autoMockedClient } from "../graphql/__mocks__/AutoMockProvider";
import { DataEntry } from "../pages/DataEntry/DataEntry";

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

beforeEach(cleanup);

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

test("should render two category sections in the add entry form", async () => {
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
  expect(screen.getAllByRole("group")).toHaveLength(2);

  expect(screen.getByRole("heading", { name: /About Gender/i }));
  expect(screen.getByRole("heading", { name: /About Disability/i }));

  expect(
    screen.getByText(
      /Gender identity expresses one's innermost concept of self as male/i
    )
  ).toBeInTheDocument();

  expect(
    screen.getByText(/A disability is any condition of the body /i)
  ).toBeInTheDocument();

  // Reset fixed date
  MockDate.reset();
});

test("should render two category sections in the edit entry form", async () => {
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

  expect(
    screen.getByRole("heading", {
      name: /Add record for BBC News | Breakfast Hour/i,
    })
  );

  expect(screen.getByRole("form"));
  expect(screen.getAllByRole("group")).toHaveLength(2);

  expect(screen.getByRole("heading", { name: /About Gender/i }));
  expect(screen.getByRole("heading", { name: /About Disability/i }));

  expect(
    screen.getByText(
      /Gender identity expresses one's innermost concept of self as male/i
    )
  ).toBeInTheDocument();

  expect(
    screen.getByText(/A disability is any condition of the body /i)
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

  expect(screen.getAllByRole("spinbutton")).toHaveLength(8);

  screen.getByRole("spinbutton", { name: /women/i });
  screen.getByRole("spinbutton", { name: /men/i });
  screen.getByRole("spinbutton", { name: /trans men/i });
  screen.getByRole("spinbutton", { name: /trans women/i });
  screen.getByRole("spinbutton", { name: /non-binary/i });
  screen.getByRole("spinbutton", { name: /gender non-conforming/i });

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

  expect(screen.getAllByRole("spinbutton")).toHaveLength(8);

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

  expect(
    await screen.findByText(/Data has been saved succesfully/i)
  ).toBeInTheDocument();

  expect(await screen.findByRole("button", { name: /Add More Data/i }));
});

test("should render success message and stay on screen if on click 'save and add another' is successful", async () => {
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

  // assert mock date is initialized in form
  expect(
    screen.getByLabelText(/publicationDate/, {
      selector: "input",
    })
  ).toHaveValue("2015-06-14");

  const input = screen.getByRole("spinbutton", {
    name: /non-binary/i,
  }) as HTMLInputElement;

  // set non-binary count to 23 and assert expected value
  fireEvent.change(input, { target: { value: "23" } });
  expect(input.value).toBe("23");

  const saveAndAddAnotherRecordButton = screen.getByRole("button", {
    name: /save and add another/i,
  });

  userEvent.click(saveAndAddAnotherRecordButton);

  // assert success notification
  expect(
    await screen.findByText(/Success! Your new record has been saved/i)
  ).toBeInTheDocument();

  // assert publication date has been cleared
  expect(await screen.findByLabelText(/publicationDate/)).not.toHaveValue(
    "2015-06-14"
  );

  // assert form values have been reset after save and add new
  expect(input.value).toBe("0");

  // reset to native Date()
  MockDate.reset();
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
