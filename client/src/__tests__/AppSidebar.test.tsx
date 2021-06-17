/* eslint-disable react/react-in-jsx-scope */
import { AppSidebar } from "../layout/AppSidebar";
import { MockedProvider } from "@apollo/client/testing";
import { BrowserRouter } from "react-router-dom";
import { GET_USER } from "../__queries__/GetUser.gql";
import React from "react";
import i18nextTest from "../services/i18next-test";
import { AuthProvider } from "../components/AuthProvider";
import { mockUserLoggedIn } from "../__mocks__/auth";
import { render } from "@testing-library/react";

describe("UK English internationalization", () => {
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

  test("translates sidebar title text to UK English", async () => {
    i18nextTest.changeLanguage("en-gb");

    const { auth } = mockUserLoggedIn();
    await auth.init();

    const sidebar = render(
      <AuthProvider auth={auth}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <BrowserRouter>
            <AppSidebar />
          </BrowserRouter>
        </MockedProvider>
      </AuthProvider>
    );

    expect(sidebar.getByText(/My Programmes/i)).toBeInTheDocument();
  });
});
