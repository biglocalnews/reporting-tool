import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter } from "react-router-dom";

import { UserAccountManagerProvider } from "../components/UserAccountManagerProvider";
import { tick, mockUserAccountClient } from "./utils";

import { VerifyAccount } from "../pages/VerifyAccount";

it("verifies the given token with the server", async () => {
  render(
    <MemoryRouter initialEntries={["/?token=foo&email=hi%40foo.bar"]}>
      <UserAccountManagerProvider value={mockUserAccountClient}>
        <VerifyAccount />
      </UserAccountManagerProvider>
    </MemoryRouter>
  );

  await tick();

  expect(mockUserAccountClient.verify).toHaveBeenCalledTimes(1);
  expect(mockUserAccountClient.verify).toHaveBeenCalledWith("foo");
});

it("returns an error if the token failed to verify", async () => {
  mockUserAccountClient.verify.mockImplementation(() =>
    Promise.reject(new Error("VERIFY_USER_BAD_TOKEN"))
  );

  render(
    <MemoryRouter initialEntries={["/?token=foo&email=hi%40foo.bar"]}>
      <UserAccountManagerProvider value={mockUserAccountClient}>
        <VerifyAccount />
      </UserAccountManagerProvider>
    </MemoryRouter>
  );

  await tick();

  expect(mockUserAccountClient.verify).toHaveBeenCalledTimes(1);
  expect(mockUserAccountClient.verify).toHaveBeenCalledWith("foo");

  // The i18n values should show an explanation and an action button.
  expect(screen.getByRole("alert")).toHaveTextContent(
    "account.verify.erroraccount.verify.errors.VERIFY_USER_BAD_TOKENaccount.verify.action"
  );
});
