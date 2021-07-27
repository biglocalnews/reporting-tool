/**
 * Basic user information collected during creation.
 */
export type CreateUserFormValues = Readonly<{
  first_name: string;
  last_name: string;
  email: string;
  username: string;
}>;

/**
 * Data that's generated by the UI form to edit the user.
 */
export type EditUserFormData = Readonly<{
  first_name: string;
  last_name: string;
  email?: string;
  roles: string[];
  teams: string[];
  username: string | null;
}>;

/**
 * Request body for resetting a user's password.
 */
export type ResetPasswordRequest = Readonly<{
  token: string;
  password: string;
}>;

/**
 * Status codes
 *
 * (Move to a separate module if others need this.)
 */
export const httpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_DATA: 204,
  BAD_REQUEST: 400,
  NOT_AUTHORIZED: 401,
  FORBIDDEN: 403,
  UNPROCESSABLE: 422,
  INTERNAL_ERROR: 500,
  BAD_GATEWAY: 502,
};

/**
 * Type of the union of values of an object
 */
type ValueOf<T> = T[keyof T];

/**
 * Any of the acceptable http status codes.
 */
type HttpStatusCode = ValueOf<typeof httpStatus>;

/**
 * Validate the response status, throwing an error if one occurred.
 */
const checkError = async (
  response: Response,
  expectedCode?: HttpStatusCode
) => {
  let json;

  // If there's a specific code specified, make sure that it matches, even if
  // the response is a 2xx code.
  const validateCode = () => {
    if (expectedCode && expectedCode !== response.status) {
      throw new Error("UNKNOWN_ERROR");
    }
  };

  switch (response.status) {
    case httpStatus.OK:
      return validateCode();
    case httpStatus.CREATED:
      return validateCode();
    case httpStatus.ACCEPTED:
      return validateCode();
    case httpStatus.NO_DATA:
      return validateCode();
    case httpStatus.BAD_REQUEST:
      json = await response.json();
      if (json.detail && json.detail.code) {
        // NOTE: there's more detail here that might be interesting to pass
        // along to the UI.
        throw new Error(json.detail.code);
      } else {
        throw new Error(json.detail || "BAD_REQUEST");
      }
    case httpStatus.UNPROCESSABLE:
      throw new Error("VALIDATION_ERROR");
    case httpStatus.NOT_AUTHORIZED:
      throw new Error("NOT_AUTHORIZED");
    case httpStatus.FORBIDDEN:
      throw new Error("FORBIDDEN");
    default:
      throw new Error("UNKNOWN_ERROR");
  }
};

/**
 * Run verification request with the given token.
 */
export const verify = async (token: string) => {
  const r = await fetch("/api/auth/verify", {
    method: "POST",
    credentials: "same-origin",
    body: JSON.stringify({ token }),
    headers: [["Content-Type", "application/json"]],
  });

  await checkError(r, httpStatus.OK);
};

/**
 * Generate a random password.
 *
 * This is only intended to be used to generate temporary passwords.
 */
export const newRandomPassword = () => {
  const sym =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!%,.^*()?".split(
      ""
    );
  let pw = "";
  for (let i = 0; i < 16; i++) {
    const rand = Math.floor(Math.random() * sym.length);
    pw += sym[rand];
  }
  return pw;
};

/**
 * Request that a user verify their email address.
 */
export const requestVerifyUser = async (email: string) => {
  // NOTE: the response from the token request is not super interesting, since
  // it always returns 202 regardless of whether the payload was incorrect.
  // Still worry about 500s, though.
  const requestVerifyResponse = await fetch("/api/auth/request-verify-token", {
    method: "POST",
    credentials: "same-origin",
    body: JSON.stringify({ email: email }),
    headers: [["Content-Type", "application/json"]],
  });

  await checkError(requestVerifyResponse, httpStatus.ACCEPTED);
};

/**
 * Function to submit user creation request to server.
 */
export const createUser = async (values: CreateUserFormValues) => {
  const r = await fetch("/api/auth/register", {
    method: "POST",
    credentials: "same-origin",
    headers: [["Content-Type", "application/json"]],
    body: JSON.stringify({
      password: newRandomPassword(),
      ...values,
    }),
  });

  await checkError(r, httpStatus.CREATED);

  const data = await r.json();
  return data["id"] as string;
};

/**
 * Function to edit an existing user.
 */
export const editUser = async (id: string, values: EditUserFormData) => {
  const r = await fetch(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...values,
      roles: values.roles?.map((r) => ({ id: r })),
      teams: values.teams?.map((t) => ({ id: t })),
    }),
    credentials: "same-origin",
    headers: [["Content-Type", "application/json"]],
  });

  await checkError(r, httpStatus.OK);
};

/**
 * De-active a user account.
 *
 * This will fail if the user doesn't have permission.
 */
export const deleteUser = async (userId: string) => {
  const response = await fetch(`/api/users/${userId}`, {
    method: "DELETE",
    credentials: "same-origin",
  });

  await checkError(response, httpStatus.NO_DATA);
};

/**
 * Re-active a user account.
 *
 * This will fail if the user doesn't have permission.
 */
export const restoreUser = async (userId: string) => {
  const r = await fetch(`/api/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({
      is_active: true,
    }),
    credentials: "same-origin",
    headers: [["Content-Type", "application/json"]],
  });

  await checkError(r, httpStatus.OK);
};

/**
 * Reset a user's password with the given token.
 */
export const resetPassword = async (params: ResetPasswordRequest) => {
  const r = await fetch("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(params),
    credentials: "same-origin",
    headers: [["Content-Type", "application/json"]],
  });

  await checkError(r, httpStatus.OK);
};

/**
 * Request that a password reset email be sent to the given user, if they exist.
 */
export const requestPasswordReset = async (email: string) => {
  const r = await fetch("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
    credentials: "same-origin",
    headers: [["Content-Type", "application/json"]],
  });

  await checkError(r, httpStatus.ACCEPTED);
};

/**
 * All the core methods together as a single unit.
 *
 * This default client can be swapped out or mocked for testing.
 */
const defaultClient = {
  verify,
  requestVerifyUser,
  newRandomPassword,
  createUser,
  editUser,
  deleteUser,
  restoreUser,
  resetPassword,
  requestPasswordReset,
};

/**
 * The default user account management client.
 */
export default defaultClient;

/**
 * Expose the client type so it can be replaced and mocked correctly in tests.
 */
export type UserAccountManager = typeof defaultClient;
