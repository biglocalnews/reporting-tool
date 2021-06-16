import React from "react";
import { shallow, mount } from "enzyme";
import toJson from "enzyme-to-json";
import App, { ProtectedAppContainer } from "../App";
import { mockUserLoggedIn, mockUserNotLoggedIn } from "../__mocks__/auth";
import { AuthProvider } from "../components/AuthProvider";
import { Login } from "../components/Login/Login";

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
