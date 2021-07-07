import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import React from "react";
import { MemoryRouter } from "react-router-dom";

import { UserAccountManagerProvider } from "../components/UserAccountManagerProvider";
import { tick, mockUserAccountClient } from "./utils";

import { ResetAccountPassword } from "../pages/ResetAccountPassword/ResetAccountPassword";

it("allows user to reset their password with a valid token", async () => {
  render(
    <MemoryRouter initialEntries={["/?token=foo&email=hi%40foo.bar"]}>
      <UserAccountManagerProvider value={mockUserAccountClient}>
        <ResetAccountPassword />
      </UserAccountManagerProvider>
    </MemoryRouter>
  );

  await tick();

  const saveButton = screen.getByRole("button", { name: /submit/i });
  fireEvent.click(saveButton);

  await tick();

  expect(mockUserAccountClient.resetPassword).toHaveBeenCalledTimes(0);

  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "newpass" },
  });
  fireEvent.click(saveButton);

  await tick();

  expect(mockUserAccountClient.resetPassword).toHaveBeenCalledTimes(1);
  expect(mockUserAccountClient.resetPassword).toHaveBeenCalledWith({
    token: "foo",
    password: "newpass",
  });
});

it("shows an error if the token wasn't validated", async () => {
  mockUserAccountClient.resetPassword.mockImplementation(async () => {
    throw new Error("RESET_PASSWORD_BAD_TOKEN");
  });

  render(
    <MemoryRouter initialEntries={["/?token=foo&email=hi%40foo.bar"]}>
      <UserAccountManagerProvider value={mockUserAccountClient}>
        <ResetAccountPassword />
      </UserAccountManagerProvider>
    </MemoryRouter>
  );

  await tick();

  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "newpass" },
  });

  const saveButton = screen.getByRole("button", { name: /submit/i });
  fireEvent.click(saveButton);

  await tick();

  // All the i18n IDs for the content of the alert with an action button.
  expect(screen.getByRole("alert")).toHaveTextContent(
    "account.resetPassword.erroraccount.resetPassword.errors.RESET_PASSWORD_BAD_TOKENaccount.resetPassword.action"
  );
});
