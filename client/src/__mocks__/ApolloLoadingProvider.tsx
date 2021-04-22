import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  InMemoryCache,
  Observable,
} from "@apollo/client";
import React from "react";

type Props = {
  children: JSX.Element;
};

const ApolloLoadingProvider = ({ children }: Props) => {
  const link = new ApolloLink((operation) => {
    /* tslint:disable:no-empty */
    return new Observable(() => {});
  });

  const client = new ApolloClient({
    link,
    cache: new InMemoryCache(),
  });

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};

export { ApolloLoadingProvider };
