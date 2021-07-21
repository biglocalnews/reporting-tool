import "@testing-library/jest-dom/extend-expect";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { UserAccountManagerProvider } from "../components/UserAccountManagerProvider";
import { ResetAccountPassword } from "../pages/ResetAccountPassword/ResetAccountPassword";
import { mockUserAccountClient, tick } from "./utils";

it("allows user to reset their password with a valid token", async () => {
  render(
    <MemoryRouter initialEntries={["/?token=foo&email=hi%40foo.bar"]}>
      <UserAccountManagerProvider value={mockUserAccountClient}>
        <ResetAccountPassword />
      </UserAccountManagerProvider>
    </MemoryRouter>
  );

  await tick();

  // With no password entered, form validation fails with the required field
  const saveButton = screen.getByRole("button", { name: /submit/i });
  fireEvent.click(saveButton);

  await tick();

  expect(mockUserAccountClient.resetPassword).toHaveBeenCalledTimes(0);

  fireEvent.change(screen.getByLabelText(/newPasswordLabel/), {
    target: { value: "newpass" },
  });
  await tick();

  fireEvent.click(saveButton);

  await tick();

  // With only one password entered, form validation fails with the required field
  expect(mockUserAccountClient.resetPassword).toHaveBeenCalledTimes(0);

  fireEvent.change(screen.getByLabelText(/retypePasswordLabel/), {
    target: { value: "mismatch" },
  });

  await tick();

  fireEvent.click(saveButton);

  await tick();

  // Mismatched passwords should also fail validation
  expect(mockUserAccountClient.resetPassword).toHaveBeenCalledTimes(0);

  fireEvent.change(screen.getByLabelText(/retypePasswordLabel/), {
    target: { value: "newpass" },
  });

  await tick();

  fireEvent.click(saveButton);

  await tick();

  // Simple passwords should fail validation
  expect(mockUserAccountClient.resetPassword).toHaveBeenCalledTimes(0);

  fireEvent.change(screen.getByLabelText(/newPasswordLabel/), {
    target: { value: "c0mpl1cat3dPa55w0rd!!" },
  });
  fireEvent.change(screen.getByLabelText(/retypePasswordLabel/), {
    target: { value: "c0mpl1cat3dPa55w0rd!!" },
  });

  await tick();

  fireEvent.click(saveButton);

  await tick();

  // Finally should have been accepted
  expect(mockUserAccountClient.resetPassword).toHaveBeenCalledTimes(1);
  expect(mockUserAccountClient.resetPassword).toHaveBeenCalledWith({
    token: "foo",
    password: "c0mpl1cat3dPa55w0rd!!",
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

  fireEvent.change(screen.getByLabelText(/newPassword/), {
    target: { value: "c0mpl1cat3dPa55w0rd!!" },
  });
  fireEvent.change(screen.getByLabelText(/retypePassword/), {
    target: { value: "c0mpl1cat3dPa55w0rd!!" },
  });

  const saveButton = screen.getByRole("button", { name: /submit/i });
  fireEvent.click(saveButton);

  await tick();

  // All the i18n IDs for the content of the alert with an action button.
  expect(screen.getByRole("alert")).toHaveTextContent(
    "account.resetPassword.erroraccount.resetPassword.errors.RESET_PASSWORD_BAD_TOKENaccount.resetPassword.action"
  );
});
