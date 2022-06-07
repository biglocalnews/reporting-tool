import {
  ApolloQueryResult,
  DocumentNode,
  OperationVariables,
  QueryHookOptions,
  useQuery,
} from "@apollo/client";

/**
 * Throw the various errors that might come from a GraphQL query response.
 */
export const throwGqlError = <T, U extends ApolloQueryResult<T | undefined>>(
  result: U,
  key: keyof T
) => {
  if (result.loading) {
    return result;
  }

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    throw new Error("GQL_MISSING_DATA");
  }

  if (!result.data[key]) {
    throw new Error("GQL_MISSING_DATA_KEY");
  }

  // TODO: decide whether to throw these or just log them.
  result.errors?.forEach((e) => {
    console.warn(e);
  });

  return result;
};

/**
 * Variation of apollo's useQuery hook with automatic error handling.
 *
 * Errors get thrown, presumably will be caught by an ErrorBoundary in the
 * tree above the component.
 *
 * The `expectedKey` is the key of the `data` object that the query is
 * expected to populate.
 */
export const useQueryWithErrorHandling = <
  T extends Record<string, any>,
  U extends OperationVariables | void = void
>(
  query: DocumentNode,
  expectedKey: keyof T,
  options?: QueryHookOptions<T, U>
) => throwGqlError(useQuery<T, U>(query, options), expectedKey);
