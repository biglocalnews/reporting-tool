import { useState } from "react";
import { useApolloClient, ApolloClient, FetchResult } from "@apollo/client";
import { TargetInput } from "../../graphql/__generated__/globalTypes";
import { useTranslation } from "react-i18next";
import { message } from "antd";

import {
  AdminUpdateProgram,
  AdminUpdateProgramVariables,
} from "../../graphql/__generated__/AdminUpdateProgram";
import { ADMIN_UPDATE_PROGRAM } from "../../graphql/__mutations__/AdminUpdateProgram.gql";
import {
  AdminDeleteProgram,
  AdminDeleteProgramVariables,
} from "../../graphql/__generated__/AdminDeleteProgram";
import { ADMIN_DELETE_PROGRAM } from "../../graphql/__mutations__/AdminDeleteProgram.gql";
import {
  AdminRestoreProgram,
  AdminRestoreProgramVariables,
} from "../../graphql/__generated__/AdminRestoreProgram";
import { ADMIN_RESTORE_PROGRAM } from "../../graphql/__mutations__/AdminRestoreProgram.gql";

/**
 * Form values filled out by the UI for editing datasetes.
 */
export type DatasetFormValues = Readonly<{
  id?: string;
  name: string;
  description: string | null;
}>;

/**
 * Form values filled out by the UI for updating the program.
 */
export type ProgramUpdateFormValues = Readonly<{
  name: string;
  description: string;
  teamId: string;
  datasets: DatasetFormValues[];
  targets: CategoryTarget[];
}>;

/**
 * Represent a single target in a category, like  "non-binary" in Gender.
 */
export type CategoryTargetSegment = Readonly<{
  categoryValueId: string;
  categoryValueName: string;
  targetId: string;
  targetValue: number;
}>;

/**
 * Represent a single category such as Gender.
 */
export type CategoryTarget = Readonly<{
  categoryId: string;
  categoryName: string;
  categoryDescription: string;
  segments: CategoryTargetSegment[];
}>;

/**
 * Type of an async function that accepts the apollo client and any number of
 * other parameters.
 */
export type HandlerFunction<
  A extends [ApolloClient<any>] = any,
  R extends FetchResult = FetchResult
> = (...args: A) => Promise<R>;

/**
 * Type of the "other" parameters that can be passed through to a handler
 * function when it's called.
 */
export type HandlerArgs<F extends HandlerFunction> = F extends (
  a: ApolloClient<any>,
  ...args: infer U
) => Promise<any>
  ? U
  : never;

/**
 * Higher-order hook factory for network operations.
 *
 * Generates a hook that runs the given handler and manages loading and error
 * handling. This is similar to just using the useMutation hook, but gives
 * more error handling and also lets us use a full function rather than just
 * the mutation itself.
 */
const getOpHook = <F extends HandlerFunction>(
  handler: F,
  successKey: string
) => {
  return () => {
    const apolloClient = useApolloClient();
    const { t } = useTranslation();
    const [inFlight, setInFlight] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    return {
      inFlight,
      error,
      run: async (...args: HandlerArgs<F>) => {
        setInFlight(true);
        setError(null);

        try {
          const result = await handler(apolloClient, ...args);
          if (result.errors) {
            result.errors.map((error) => {
              console.error(error);
            });
            throw new Error("MUTATION_ERROR");
          }

          if (!result.data) {
            throw new Error("MUTATION_ERROR_MISSING_DATA");
          }

          message.success(t(`admin.program.edit.${successKey}`));
        } catch (e) {
          setError(e);
        } finally {
          setInFlight(false);
        }
      },
    };
  };
};

/**
 * State and functions related to deactivating a program.
 */
export const useDeactivate = getOpHook(
  async (apolloClient: ApolloClient<any>, id: string) =>
    apolloClient.mutate<AdminDeleteProgram, AdminDeleteProgramVariables>({
      mutation: ADMIN_DELETE_PROGRAM,
      variables: { input: id },
    }),
  "deactivateSuccess"
);

/**
 * State and functions related to saving a program.
 */
export const useSave = getOpHook(
  async (
    apolloClient: ApolloClient<any>,
    programId: string,
    input: ProgramUpdateFormValues
  ) => {
    const targets = input.targets.reduce((allTargets, current) => {
      current.segments.forEach((segment) => {
        allTargets.push({
          id: segment.targetId,
          target: segment.targetValue,
          categoryValue: {
            id: segment.categoryValueId,
            name: segment.categoryValueName,
            category: {
              id: current.categoryId,
            },
          },
        });
      });
      return allTargets;
    }, [] as TargetInput[]);

    return apolloClient.mutate<AdminUpdateProgram, AdminUpdateProgramVariables>(
      {
        mutation: ADMIN_UPDATE_PROGRAM,
        variables: {
          input: {
            id: programId,
            name: input.name,
            description: input.description,
            datasets: input.datasets.map((dataset) => ({
              id: dataset.id,
              name: dataset.name,
              description: dataset.description,
            })),
            targets,
          },
        },
      }
    );
  },
  "saveSuccess"
);

/**
 * State and functions related to restoring a deleted program.
 */
export const useRestore = getOpHook(
  async (apolloClient: ApolloClient<any>, id: string) =>
    apolloClient.mutate<AdminRestoreProgram, AdminRestoreProgramVariables>({
      mutation: ADMIN_RESTORE_PROGRAM,
      variables: {
        input: id,
      },
    }),
  "restoreSuccess"
);
