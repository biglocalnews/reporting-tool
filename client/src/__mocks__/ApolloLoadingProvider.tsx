import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
} from "@apollo/client";

const mockedLoadingClient = () => {
  const link = new ApolloLink(() => {
    /* eslint-disable no-empty, @typescript-eslint/no-empty-function */
    return new Observable(() => {});
  });

  const client = new ApolloClient({
    link,
    cache: new InMemoryCache(),
  });

  return client;
};

export { mockedLoadingClient };
