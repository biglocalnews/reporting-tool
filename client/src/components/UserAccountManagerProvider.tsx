import React, { useContext } from "react";
import account, { UserAccountManager } from "../services/account";

/**
 * Context container for the account client.
 *
 * By default this uses the built-in client, but it can be mocked for testing.
 */
const UserAccountManagerContext =
  React.createContext<UserAccountManager>(account);

/**
 * Component that provides the account client.
 */
export const UserAccountManagerProvider = UserAccountManagerContext.Provider;

/**
 * React hook to get the account client from the context.
 */
export const useUserAccountManager = () =>
  useContext(UserAccountManagerContext);
