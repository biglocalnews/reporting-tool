/**
 * Helpers for mocking common auth scenarios.
 *
 * This relies on the jest-fetch-mock being enabled.
 */

import { Auth, UserProfile } from "../../services/auth";

/**
 * Default user profile to use for tests.
 *
 * These values can be overriden by the mocking utils.
 */
const defaultUser: UserProfile = {
  first_name: "Penelope",
  last_name: "Pomegranate",
  email: "penelope@pomegran.ate",
  last_login: "2021-03-05T10:10:10Z",
  last_changed_password: "2021-03-05T10:10:10Z",
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
 * Create a new unauthorized response from /users/me
 */
const createUnauthorizedProfileResponse = () =>
  new Response(
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

/**
 * Create a successful response from /users/me
 */
const createAuthorizedProfileResponse = (user?: Partial<UserProfile>) =>
  new Response(
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

/**
 * Simulate logging in with a correct username and password.
 */
export const mockUserLogIn = (
  email: string,
  password: string,
  firstTime = false
) => {
  let loggedIn = false;

  const mock = jest.fn(
    async (uri: string, props?: RequestInit): Promise<Response> => {
      switch (uri) {
        case "/api/users/me":
          if (!loggedIn) {
            return createUnauthorizedProfileResponse();
          }
          return new Response(
            JSON.stringify({
              ...defaultUser,
              last_login: firstTime ? null : defaultUser.last_login,
              last_changed_password: firstTime
                ? null
                : defaultUser.last_changed_password,
              email,
            }),
            {
              headers: new Headers({
                "Content-Type": "application/json",
              }),
              status: 200,
            }
          );
        case "/api/reset-my-password":
          return new Response(JSON.stringify({ token: "resettoken" }), {
            headers: new Headers({
              "Content-Type": "application/json",
            }),
            status: 200,
          });
        case "/api/auth/cookie/login":
          expect(props?.method).toEqual("POST");
          expect(props?.credentials).toEqual("same-origin");

          // Check username password; return unauthorized if they don't match
          if (
            (props?.body as FormData).get("username") !== email ||
            (props?.body as FormData).get("password") !== password
          ) {
            return new Response(JSON.stringify({ detail: "Unauthorized" }), {
              headers: new Headers({ "Content-Type": "application/json" }),
              status: 400,
            });
          }
          loggedIn = true;
          return new Response("", { status: 200 });
        case "/api/auth/cookie/logout":
          expect(props).toEqual({ method: "POST", credentials: "same-origin" });
          loggedIn = false;
          return new Response("", { status: 200 });
        default:
          throw new Error("Unexpected request:" + uri);
      }
    }
  ) as typeof fetch;

  const auth = new Auth(mock);

  return { auth, mock } as AuthMockReturnValue;
};

/**
 * Simulate having a valid authentication cookie for the given user.
 */
export const mockUserLoggedIn = (user?: Partial<UserProfile>) => {
  const mock = jest.fn(async (uri: string): Promise<Response> => {
    if (uri === "/api/users/me") {
      return createAuthorizedProfileResponse(user);
    }

    throw new Error("Unexpected request: " + JSON.stringify(uri));
  }) as typeof fetch;

  const auth = new Auth(mock);

  return { auth, mock } as AuthMockReturnValue;
};

/**
 * Mock the API in "blank slate" mode.
 */
export const mockBlankSlate = () => {
  const mock = jest.fn(async (uri: string): Promise<Response> => {
    if (uri === "/api/users/me") {
      return new Response(
        JSON.stringify({
          details: "App is not configured",
        }),
        {
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          status: 418,
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
    if (uri === "/api/users/me") {
      return createUnauthorizedProfileResponse();
    }

    throw new Error("Unexpected request: " + JSON.stringify(uri));
  }) as typeof fetch;

  const auth = new Auth(mock);

  return { auth, mock } as AuthMockReturnValue;
};
