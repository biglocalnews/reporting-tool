import {
  ApolloClient,
  ApolloProvider,
  from,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { AuthProvider } from "./components/AuthProvider";
import { Loading } from "./components/Loading/Loading";
import { UserAccountManagerProvider } from "./components/UserAccountManagerProvider";
import reportWebVitals from "./reportWebVitals";
import * as account from "./services/account";
import { Auth } from "./services/auth";
import "./services/i18next";

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.map(({ message, locations, path }) =>
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );
  if (networkError) console.log(`[Network error]: ${networkError}`);
});

const httpLink = new HttpLink({
  uri:
    process.env.REACT_APP_ENV === "mock"
      ? "http://localhost:4000"
      : "/graphql/",
});

const cache = new InMemoryCache({
  typePolicies: {
    Dataset: {
      fields: {
        records: {
          merge: false,
        },
      },
    },
  },
});

const client: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  cache,
  link: from([errorLink, httpLink]),
});

// Create a new auth service, and initialize it. The `init` request is actually
// a promise that's sent asynchronously; it will be awaited during rener with
// the Suspense hook in AuthProvider.
const auth = new Auth(window.fetch.bind(window));
auth.init();

const MainApp = () => {
  return (
    <Suspense fallback={<Loading />}>
      <ApolloProvider client={client}>
        <AuthProvider auth={auth}>
          <UserAccountManagerProvider value={account}>
            <App />
          </UserAccountManagerProvider>
        </AuthProvider>
      </ApolloProvider>
    </Suspense>
  );
};

if (process.env.NODE_ENV !== "production") {
  import("react-axe").then((axe) => {
    axe.default(React, ReactDOM, 1000);
    ReactDOM.render(<MainApp />, document.getElementById("root"));
  });
} else {
  ReactDOM.render(<MainApp />, document.getElementById("root"));
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
