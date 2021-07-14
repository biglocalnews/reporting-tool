import { mount, shallow } from "enzyme";
import toJson from "enzyme-to-json";
import { MemoryRouter } from "react-router-dom";
import App, { ProtectedAppContainer } from "../App";
import { AuthProvider } from "../components/AuthProvider";
import {
  mockUserLoggedIn,
  mockUserNotLoggedIn,
} from "../graphql/__mocks__/auth";
import { AppAdminSidebarMenu, AppSidebar } from "../layout/AppSidebar";
import { Login } from "../pages/Login/Login";

it("renders App correctly", async () => {
  const { auth } = mockUserLoggedIn();
  await auth.init();

  const tree = shallow(<App />, {
    wrappingComponent: AuthProvider,
    wrappingComponentProps: { auth },
  });

  expect(toJson(tree)).toMatchSnapshot();
});

it("renders Login when not authed", async () => {
  const { auth } = mockUserNotLoggedIn();
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
  const { auth } = mockUserLoggedIn({
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
  const { auth } = mockUserLoggedIn({
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
