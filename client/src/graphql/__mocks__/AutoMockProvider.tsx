import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
  split,
} from "@apollo/client";
import { SchemaLink } from "@apollo/client/link/schema";
import { addMockFunctionsToSchema } from "apollo-server";
import { GraphQLError } from "graphql";
import { makeExecutableSchema } from "graphql-tools";
import { buildClientSchema, printSchema } from "graphql/utilities";
import introspectionResult from "../../schema.json";
import { mockResolvers } from "./MockResolvers";

/**
 * mocks data automatically using introspection schema
 * @see https://www.youtube.com/watch?v=FKA5iNYpd_8&t=43s
 */

const autoMockedClient = (
  customResolvers?: any,
  graphQLError?: GraphQLError[] | undefined
) => {
  // Convert JSON schema into Schema Definition Language
  const schemaSDL = printSchema(buildClientSchema(introspectionResult as any));

  // Make schema "executable"
  const schema = makeExecutableSchema({
    typeDefs: schemaSDL,
    resolverValidationOptions: {
      requireResolversForResolveType: "ignore",
    },
  });

  // Apply global mock and custom passed resolvers to executable schema
  addMockFunctionsToSchema({ schema: schema, mocks: mockResolvers });

  // Define errors
  const errorLink = new ApolloLink(() => {
    return new Observable((observer) => {
      observer.next({
        errors: graphQLError,
      });
      observer.complete();
    });
  });

  // Define links
  const schemaLink = new SchemaLink({ schema });
  const splitLink = split(() => !!graphQLError, errorLink, schemaLink);

  // Define ApolloClient (client variable used below)
  const client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
  });

  return client;
};

export { autoMockedClient };
