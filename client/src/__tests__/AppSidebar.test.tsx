/* eslint-disable react/react-in-jsx-scope */
import { AppSidebar } from "../layout/AppSidebar";
import { mount, shallow } from "enzyme";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import SubMenu from "antd/lib/menu/SubMenu";
import { MockedProvider } from "@apollo/client/testing";
import { act, render, wait, waitFor } from "@testing-library/react";
import { gql } from "@apollo/client";
import { BrowserRouter } from "react-router-dom";
import { GET_USER } from "../__queries__/GetUser.gql";

describe("UK English internationalization", () => {
  beforeAll(() => {
    // Mock react-i18next
    i18next.use(initReactI18next).init({
      lng: "en-gb",
      fallbackLng: "en-gb",
      interpolation: {
        escapeValue: false,
      },
      keySeparator: false,
      resources: {
        "en-gb": {
          translation: {
            teamsSideBarTitle: "My Programmes",
          },
        },
        en: {
          teamsSideBarTitle: "My Programs",
        },
      },
      lowerCaseLng: true,
    });
  });

  const mocks = [
    {
      request: {
        query: GET_USER,
        variables: {
          id: "1",
        },
      },
      result: {
        data: {
          user: {
            firstName: "Mary",
            lastName: "Apple",
            teams: [
              {
                programs: [
                  {
                    id: "25c140cc-6cd0-4bd3-8230-35b56e59481a",
                    name: "BBC News",
                    datasets: [
                      {
                        id: "5a8ee1d5-2b5a-49db-b466-68fe50a27cdb",
                        name: "Breakfast Hour",
                        description: "Hello World",
                        records: [
                          {
                            id: "05caae8d-bb1a-416e-9dda-bb251fe474ff",
                            publicationDate: "2020-12-20",
                          },
                          {
                            id: "record-uuid",
                            publicationDate: "1972-10-06",
                          },
                        ],
                        tags: [
                          {
                            name: "eligendi",
                          },
                          {
                            name: "in",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    },
  ];

  // TODO: revisit test for loading state
  test.skip("translates sidebar title text to UK English", async () => {
    const sidebar = mount(
      <MockedProvider mocks={mocks} addTypename={false}>
        <BrowserRouter>
          <AppSidebar />
        </BrowserRouter>
      </MockedProvider>
    );

    expect(sidebar.find(SubMenu).first().prop("title")).toBe("My Programmes");
  });
});
