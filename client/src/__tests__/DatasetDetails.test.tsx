import { MockedProvider } from "@apollo/client/testing";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { DatasetDetails } from "../components/DatasetDetails/DatasetDetails";
import { createMemoryHistory } from "history";
import { Router } from "react-router-dom";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import userEvent from "@testing-library/user-event";
import { AutoMockedProvider } from "../__mocks__/AutoMockProvider";

const history = createMemoryHistory();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest
    .fn()
    .mockReturnValue({ datasetId: "5a8ee1d5-2b5a-49db-b466-68fe50a27cdb" }),
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
        addData: "Add Data",
      },
    },
    en: {
      addData: "Add Data",
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

test("gets dataset records when component is mounted and displays them in a table", async () => {
  render(
    <AutoMockedProvider>
      <Router history={history}>
        <DatasetDetails />
      </Router>
    </AutoMockedProvider>
  );

  expect(screen).toBeTruthy();
  expect(screen.getByText("Loading")).toBeInTheDocument();

  await wait();

  expect(screen.getByText("BBC News")).toBeInTheDocument();
  expect(screen.getByRole("table"));

  expect(screen.getAllByRole("row")).toHaveLength(1);
});

test("clicking on the add data button routes to the data entry page", async () => {
  render(
    <AutoMockedProvider>
      <Router history={history}>
        <DatasetDetails />
      </Router>
    </AutoMockedProvider>
  );

  await wait();

  const addDataButton = screen.getByRole("button", { name: "plus Add Data" });
  userEvent.click(addDataButton);

  expect(history.location.pathname).toBe(
    "/dataset/5a8ee1d5-2b5a-49db-b466-68fe50a27cdb/entry"
  );
});

test("should delete table from record when delete button is clicked", async () => {
  const { container } = render(
    <AutoMockedProvider>
      <Router history={history}>
        <DatasetDetails />
      </Router>
    </AutoMockedProvider>
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
