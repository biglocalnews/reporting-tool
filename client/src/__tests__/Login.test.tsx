import "@testing-library/jest-dom/extend-expect";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { AuthProvider } from "../components/AuthProvider";
import { UserAccountManagerProvider } from "../components/UserAccountManagerProvider";
import { mockUserLogIn, mockUserNotLoggedIn } from "../graphql/__mocks__/auth";
import { Login } from "../pages/Login/Login";
import { mockUserAccountClient, tick } from "./utils";

it("redirects user to the main page when they login (not on their first time)", async () => {
  const user = "tester@notrealemail.info";
  const password = "password";
  const { auth } = mockUserLogIn(user, password);
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

  fireEvent.change(screen.getByRole("textbox", { name: /e-mail/ }), {
    target: { value: user },
  });
  fireEvent.change(document.querySelector(`[aria-label="password"]`)!, {
    target: { value: password },
  });
  await tick();

  fireEvent.click(screen.getByRole("button", { name: /action/ }));

  await tick();

  expect(history.location.pathname).toEqual("/");
  expect(history.location.search).toEqual("");
});

it("prompts user to reset their password on their first login", async () => {
  const user = "tester@notrealemail.info";
  const password = "password";
  const { auth } = mockUserLogIn(user, password, true);
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

  fireEvent.change(screen.getByRole("textbox", { name: /e-mail/ }), {
    target: { value: user },
  });
  fireEvent.change(document.querySelector(`[aria-label="password"]`)!, {
    target: { value: password },
  });
  await tick();

  fireEvent.click(screen.getByRole("button", { name: /action/ }));

  await tick();

  expect(history.location.pathname).toEqual("/account/reset-password");
  expect(history.location.search).toEqual(
    "?email=tester%40notrealemail.info&token=resettoken"
  );
});

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
