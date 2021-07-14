import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { createMemoryHistory } from "history";

import { UserAccountManagerProvider } from "../components/UserAccountManagerProvider";
import { tick, mockUserAccountClient } from "./utils";
import { AuthProvider } from "../components/AuthProvider";
import { mockUserNotLoggedIn } from "../graphql/__mocks__/auth";

import { Login } from "../pages/Login/Login";

it("allows user to reset their password with their email", async () => {
  const { auth } = mockUserNotLoggedIn();
  await auth.init();

  const history = createMemoryHistory();
  const location = {
    state: {},
    pathname: "",
    search: "",
    hash: "",
  };
  const match = {
    params: {},
    isExact: true,
    path: "",
    url: "",
  };

  render(
    <AuthProvider auth={auth}>
      <UserAccountManagerProvider value={mockUserAccountClient}>
        <Login history={history} match={match} location={location} />
      </UserAccountManagerProvider>
    </AuthProvider>
  );

  await tick();

  fireEvent.click(screen.getByRole("button", { name: /forgot/i }));

  await tick();

  fireEvent.change(screen.getByTestId("email-reset"), {
    target: { value: "my@email.info" },
  });

  fireEvent.click(
    screen.getByRole("button", { name: /forgotPasswordAction/i })
  );

  await tick();

  expect(mockUserAccountClient.requestPasswordReset).toHaveBeenCalledTimes(1);
  expect(mockUserAccountClient.requestPasswordReset).toHaveBeenCalledWith(
    "my@email.info"
  );

  expect(
    screen.getByText("account.resetPassword.reresetSuccess")
  ).toBeInTheDocument();
});
