import React from "react";
import { MemoryRouter } from "react-router-dom";
import { shallow, mount } from "enzyme";
import toJson from "enzyme-to-json";
import App, { ProtectedAppContainer } from "../App";
import {
  mockUserLoggedIn,
  mockUserNotLoggedIn,
} from "../graphql/__mocks__/auth";
import { AuthProvider } from "../components/AuthProvider";
import { Login } from "../components/Login/Login";
import { AppSidebar, AppAdminSidebarMenu } from "../layout/AppSidebar";

it("renders App correctly", async () => {
  const { auth, mock } = mockUserLoggedIn();
  await auth.init();

  const tree = shallow(<App />, {
    wrappingComponent: AuthProvider,
    wrappingComponentProps: { auth },
  });

  expect(toJson(tree)).toMatchSnapshot();
});

it("renders Login when not authed", async () => {
  const { auth, mock } = mockUserNotLoggedIn();
  await auth.init();

  const tree = mount(<App />, {
    wrappingComponent: AuthProvider,
    wrappingComponentProps: { auth },
  });

  const login = tree.find(Login);
  expect(login).toBeTruthy();
});

test("renders ProtectedAppContainer correctly", async () => {
  const tree = shallow(
    <ProtectedAppContainer>
      <div />
    </ProtectedAppContainer>
  );
  expect(toJson(tree)).toMatchSnapshot();
});

it("renders admin stuff when authed as admin", async () => {
  const { auth, mock } = mockUserLoggedIn({
    roles: [{ name: "admin", description: "" }],
  });
  await auth.init();

  const tree = shallow(<App />, {
    wrappingComponent: AuthProvider,
    wrappingComponentProps: { auth },
  });

  expect(toJson(tree)).toMatchSnapshot();
});

it("renders custom sidebar for admin", async () => {
  const { auth, mock } = mockUserLoggedIn({
    roles: [{ name: "admin", description: "" }],
  });
  await auth.init();

  const tree = mount(
    <MemoryRouter>
      <AuthProvider auth={auth}>
        <AppSidebar />
      </AuthProvider>
    </MemoryRouter>
  );

  const adminSidebar = tree.find(AppAdminSidebarMenu);
  expect(adminSidebar).toBeTruthy();
});
