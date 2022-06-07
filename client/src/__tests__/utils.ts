import { act } from "@testing-library/react";

/**
 * Mock account management REST client
 */
export const mockUserAccountClient = {
  verify: jest.fn(() => Promise.resolve()),
  requestVerifyUser: jest.fn(() => Promise.resolve()),
  newRandomPassword: jest.fn(() => "newpassword"),
  createUser: jest.fn(() =>
    Promise.resolve("1249f779-2ac3-4f1d-b052-f753c26860a5")
  ),
  editUser: jest.fn(() => Promise.resolve()),
  deleteUser: jest.fn(() => Promise.resolve()),
  restoreUser: jest.fn(() => Promise.resolve()),
  resetPassword: jest.fn(() => Promise.resolve()),
  requestPasswordReset: jest.fn(() => Promise.resolve()),
};

/**
 * Pause to let async react rendering things happen.
 *
 * Useful for components that rely on a `useQuery` hook. This function is
 * based on the tips given by Apollo for using their MockedProvider.
 *
 * https://www.apollographql.com/docs/react/development-testing/testing/#testing-the-success-state
 *
 * This function is also wrapped in `act` like other functions in the
 * @testing-library module.
 *
 * Usage:
 *   Call `await tick()` during an async test after render and before making
 *   assertions on the rendered component.
 */
export const tick = async () =>
  act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
