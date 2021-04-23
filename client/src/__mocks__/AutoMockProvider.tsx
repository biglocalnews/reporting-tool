import React from "react";
import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  InMemoryCache,
  Observable,
  split,
} from "@apollo/client";
import { makeExecutableSchema, IMocks, mergeResolvers } from "graphql-tools";
import { printSchema, buildClientSchema } from "graphql/utilities";
import introspectionResult from "../schema.json";
import { GraphQLError } from "graphql";
import { SchemaLink } from "@apollo/client/link/schema";
import { addMockFunctionsToSchema } from "apollo-server";
import { mockResolvers } from "./MockResolvers";

type Props = {
  children: JSX.Element;
  customResolvers?: IMocks;
  graphQLError?: GraphQLError[];
};

/**
 * mocks data automatically using introspection schema
 * @see https://www.youtube.com/watch?v=FKA5iNYpd_8&t=43s
 */

const AutoMockedProvider = ({ children, customResolvers, errors }: any) => {
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
  const resolvers = [mockResolvers, customResolvers] ?? [mockResolvers];
  const mocks = mergeResolvers(resolvers);
  addMockFunctionsToSchema({ schema, mocks });

  // Define errors
  const errorLink = new ApolloLink((operation) => {
    return new Observable((observer) => {
      observer.next({
        errors: errors || [
          { message: "Unspecified error from ErrorProvider." },
        ],
      });
      observer.complete();
    });
  });

  // Define links
  const schemaLink = new SchemaLink({ schema });
  const splitLink = split(() => !!errors, errorLink, schemaLink);

  // Define ApolloClient (client variable used below)
  const client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
  });

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};

export { AutoMockedProvider };
