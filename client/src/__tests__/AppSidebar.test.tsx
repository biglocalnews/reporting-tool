/* eslint-disable react/react-in-jsx-scope */
import { AppSidebar } from "../components/AppSidebar";
import { mount, shallow } from "enzyme";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import SubMenu from "antd/lib/menu/SubMenu";
import { MockedProvider } from "@apollo/client/testing";
import { render, waitFor } from "@testing-library/react";
import { gql } from "@apollo/client";
import { BrowserRouter } from "react-router-dom";

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

  test("translates sidebar title text to UK English", () => {
    const sidebar = mount(
      <MockedProvider>
        <BrowserRouter>
          <AppSidebar />
        </BrowserRouter>
      </MockedProvider>
    );
    expect(sidebar.find(SubMenu).first().prop("title")).toBe("My Programmes");
  });
});
