import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./i18n/i18next";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { cache } from './cache'
import {
  ApolloClient,
  ApolloProvider,
  NormalizedCacheObject,
  gql
} from '@apollo/client';

const client: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  cache,
  uri: '/graphql/'
});

client
  .query({
    query: gql`
    query getMyUsers {
      users {
        users {
          id
          firstName
          lastName
        }
      }
    }
    `
  })
  .then(result => console.log(result));

ReactDOM.render(
  <ApolloProvider client={client}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ApolloProvider>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
