import React, { useContext } from "react";
import { Auth } from "../services/auth";

/**
 * Context containing auth object.
 */
const AuthContext = React.createContext<Auth | null>(null);

/**
 * Component to hook into suspense and provide the given auth object.
 */
export const AuthProvider = ({ auth, children }: any) => {
  if (auth.initState !== "ready") {
    throw auth.init();
  }

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

/**
 * React hook to get the auth object from context.
 */
export const useAuth = () => useContext(AuthContext)!;
