import { MockedProvider } from "@apollo/client/testing";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { DatasetDetails } from "../components/DatasetDetails/DatasetDetails";
import { createMemoryHistory } from "history";
import { Router } from "react-router-dom";
import {
  deleteRecordMutationFixture,
  getDatasetQueryFixture,
} from "../__mocks__/mockData";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import userEvent from "@testing-library/user-event";

const mocks = [getDatasetQueryFixture, deleteRecordMutationFixture];

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest
    .fn()
    .mockReturnValue({ datasetId: "5a8ee1d5-2b5a-49db-b466-68fe50a27cdb" }),
}));

async function wait(ms = 0) {
  await act(() => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  });
}

describe("Dataset Details component", () => {
  beforeAll(() => {
    // Mock react-i18next
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
  });

  const history = createMemoryHistory();

  test("gets dataset records when component is mounted and displays them in a table", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <Router history={history}>
          <DatasetDetails />
        </Router>
      </MockedProvider>
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
      <MockedProvider mocks={mocks}>
        <Router history={history}>
          <DatasetDetails />
        </Router>
      </MockedProvider>
    );

    await wait();

    const addDataButton = screen.getByRole("button", { name: "plus Add Data" });
    userEvent.click(addDataButton);

    expect(history.location.pathname).toBe(
      "/dataset/5a8ee1d5-2b5a-49db-b466-68fe50a27cdb/entry"
    );
  });

  test("should delete table from record when delete button is clicked", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <Router history={history}>
          <DatasetDetails />
        </Router>
      </MockedProvider>
    );

    await wait();

    const firstRowOfRecords = screen.getAllByRole("row")[0];
    userEvent.click(
      within(firstRowOfRecords).getByRole("button", { name: "Delete" })
    );

    const popConfirmDeleteAction = screen.getByRole("tooltip");
    userEvent.click(
      within(popConfirmDeleteAction).getByRole("button", {
        name: "Yes, delete",
      })
    );

    await wait();

    expect(screen.getAllByRole("row")).toHaveLength(0);
  });
});
