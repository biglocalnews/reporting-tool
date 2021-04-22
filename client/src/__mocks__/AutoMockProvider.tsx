import React, { ReactNode } from "react";
import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  InMemoryCache,
  Observable,
  split,
} from "@apollo/client";
import {
  makeExecutableSchema,
  addMocksToSchema,
  IMocks,
  mergeResolvers,
} from "graphql-tools";
import { printSchema, buildClientSchema } from "graphql/utilities";
import introspectionResult from "../schema.json";
import { GraphQLError } from "graphql";
import { SchemaLink } from "@apollo/client/link/schema";
import { addMockFunctionsToSchema } from "apollo-server";
import { mockResolvers } from "./MockResolvers";

type Props = {
  children: JSX.Element;
  customResolvers?: IMocks;
  errors?: GraphQLError[];
};

const AutoMockedProvider = ({ children, customResolvers, errors }: any) => {
  // 1) Convert JSON schema into Schema Definition Language
  const schemaSDL = printSchema(buildClientSchema(introspectionResult as any));

  // 2) Make schema "executable"
  const schema = makeExecutableSchema({
    typeDefs: schemaSDL,
    resolverValidationOptions: {
      requireResolversForResolveType: "ignore",
    },
  });

  // 3) Apply mock resolvers to executable schema
  const resolvers = [mockResolvers, customResolvers] ?? [mockResolvers];
  const mocks = mergeResolvers(resolvers);
  addMockFunctionsToSchema({ schema, mocks });

  // 4) Define errors
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
  const schemaLink = new SchemaLink({ schema });

  const splitLink = split(() => !!errors, errorLink, schemaLink);

  // 5) Define ApolloClient (client variable used below)
  const client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
  });

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};

export { AutoMockedProvider };
