import React from "react";
import ReactDOM from "react-dom";
import "./services/i18next";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import {
  ApolloClient,
  ApolloProvider,
  NormalizedCacheObject,
  InMemoryCache,
  HttpLink,
  from,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";

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

const client: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  cache: new InMemoryCache(),
  link: from([errorLink, httpLink]),
});

const MainApp = () => {
  return (
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
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
