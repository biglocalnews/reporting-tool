import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
} from "@apollo/client";

const mockedLoadingClient = () => {
  const link = new ApolloLink((operation) => {
    /* tslint:disable:no-empty */
    return new Observable(() => {});
  });

  const client = new ApolloClient({
    link,
    cache: new InMemoryCache(),
  });

  return client;
};

export { mockedLoadingClient };
