/**
 * Helpers for mocking common auth scenarios.
 *
 * This relies on the jest-fetch-mock being enabled.
 */

import { Auth, UserProfile } from "../services/auth";

/**
 * Default user profile to use for tests.
 *
 * These values can be overriden by the mocking utils.
 */
const defaultUser: UserProfile = {
  first_name: "Penelope",
  last_name: "Pomegranate",
  email: "penelope@pomegran.ate",
  is_active: true,
  is_verified: true,
  id: "cb1aa2f7-2b27-4649-ba0d-f5c1e60fbb92",
  roles: [],
};

/**
 * Return values from these mocking functions.
 */
type AuthMockReturnValue = {
  auth: Auth;
  mock: jest.Mock;
};

/**
 * Simulate having a valid authentication cookie for the given user.
 */
export const mockUserLoggedIn = (user?: Partial<UserProfile>) => {
  const mock = jest.fn(async (uri: string): Promise<Response> => {
    if (uri === "/users/me") {
      return new Response(
        JSON.stringify({
          ...defaultUser,
          ...(user || {}),
        }),
        {
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          status: 200,
        }
      );
    }

    throw new Error("Unexpected request: " + JSON.stringify(uri));
  }) as typeof fetch;

  const auth = new Auth(mock);

  return { auth, mock } as AuthMockReturnValue;
};

/**
 * Simulate not being logged in.
 */
export const mockUserNotLoggedIn = () => {
  const mock = jest.fn(async (uri: string): Promise<Response> => {
    if (uri === "/users/me") {
      return new Response(
        JSON.stringify({
          details: "Unauthorized",
        }),
        {
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          status: 401,
        }
      );
    }

    throw new Error("Unexpected request: " + JSON.stringify(uri));
  }) as typeof fetch;

  const auth = new Auth(mock);

  return { auth, mock } as AuthMockReturnValue;
};
