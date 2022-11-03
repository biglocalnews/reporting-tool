import {
  ApolloClient,
  ApolloProvider,
  from,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client";
import { message } from 'antd';
import { RetryLink } from "@apollo/client/link/retry";
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

const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: Infinity,
    jitter: true
  },
  attempts: {
    max: 5,
    retryIf: (error, _operation) => !!error || !!_operation
  }
});

const errorLink = onError((err) => {
  if (err.graphQLErrors)
    err.graphQLErrors.map(({ message: msg, locations, path }) =>
      message.error(
        `[GraphQL error]: Message: ${msg}, Location: ${locations}, Path: ${path}`
      )
    );
  if (err.networkError) {
    message.error(`[Network error]: ${err.networkError}`);
  }

  /*if (err.response?.errors) {
    err.response.errors.map(x =>
      message.error(
        `[Response error]: Message: ${x.message}, Location: ${x.locations}, Path: ${x.path}`
      )
    );
  }*/

});

const httpLink = new HttpLink({
  uri:
    process.env.REACT_APP_ENV === "mock"
      ? "http://localhost:4000"
      : "/api/graphql/",

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
  link: from([errorLink, retryLink, httpLink]),
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
  // eslint-disable @typescript-eslint/ban-ts-comment
  // @ts-ignore
  import("@axe-core/react").then((axe) => {
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
