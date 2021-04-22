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
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return new Observable(() => {});
  });

  const client = new ApolloClient({
    link,
    cache: new InMemoryCache(),
  });

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};

export { ApolloLoadingProvider };
