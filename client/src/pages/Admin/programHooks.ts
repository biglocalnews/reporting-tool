import { ApolloClient, FetchResult, useApolloClient } from "@apollo/client";
import { message } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AdminDeleteProgram,
  AdminDeleteProgramVariables,
} from "../../graphql/__generated__/AdminDeleteProgram";
import {
  AdminRestoreProgram,
  AdminRestoreProgramVariables,
} from "../../graphql/__generated__/AdminRestoreProgram";
import {
  AdminUpdateProgram,
  AdminUpdateProgramVariables,
} from "../../graphql/__generated__/AdminUpdateProgram";

import { ADMIN_DELETE_PROGRAM } from "../../graphql/__mutations__/AdminDeleteProgram.gql";
import { ADMIN_RESTORE_PROGRAM } from "../../graphql/__mutations__/AdminRestoreProgram.gql";
import { ADMIN_UPDATE_PROGRAM } from "../../graphql/__mutations__/AdminUpdateProgram.gql";
import { GET_DATASET } from "../../graphql/__queries__/GetDataset.gql";

import { ReportingPeriodType } from "../../graphql/__generated__/globalTypes";

/**
 * Form values filled out by the UI for editing datasetes.
 */
export type DatasetFormValues = Readonly<{
  id?: string;
  name: string;
  description: string | null;
  personTypes: string[];
  customColumns: string[] | undefined;
}>;

/*type customColumn = Readonly<{
  id?: string;
  name: string;
  type: CustomColumnType | null;
  description: string | null;
}>;*/

/**
 * Form values to represent a tag for a program.
 */
export type TagFormValues = Readonly<{
  name: string;
  tagType: string | null;
  id: string;
  description: string | null;
}>;

/**
 * Form values filled out by the UI for updating the program.
 */
export type ProgramUpdateFormValues = Readonly<{
  name: string;
  description: string;
  teamId?: string;
  tags: TagFormValues[];
  datasets: DatasetFormValues[];
  targets: Target[];
  reportingPeriodType: ReportingPeriodType,
  reportingPeriods: ReportingPeriod[]
}>;

export type ReportingPeriod = Readonly<{
  id: string;
  begin: any;
  end: any;
  range: [moment.Moment, moment.Moment];
  description: string | null;
}>

/**
 * Represent a single track in a target, like  "non-binary" in Gender.
 */
export type TargetTrack = Readonly<{
  id: string;
  categoryValue: CategoryValue;
  targetMember: boolean;
}>;

export type Category = Readonly<{
  id: string;
  name: string;
  description: string;
}>

export type CategoryValue = Readonly<{
  id: string;
  name: string;
  category: { id: string }
}>

/**
 * Represent a target
 */
export type Target = Readonly<{
  id: string | null;
  category: Category;
  target: number;
  tracks: TargetTrack[];
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
      /**
       * Function to run the operation and manage state around it. Returns a
       * boolean indicating whether operation succeeded without error.
       */
      run: async (...args: HandlerArgs<F>) => {
        setInFlight(true);
        setError(null);
        let success = false;

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
          success = true;
        } catch (e: unknown) {
          if (e instanceof Error) {
            console.error(e);
            setError(e);
          }
        } finally {
          setInFlight(false);
        }
        return success;
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
    return apolloClient.mutate<AdminUpdateProgram, AdminUpdateProgramVariables>(
      {
        mutation: ADMIN_UPDATE_PROGRAM,
        variables: {
          input: {
            id: programId,
            name: input.name,
            description: input.description,
            teamId: input.teamId,
            tags: input.tags.map((tag) => ({
              id: tag.id,
              name: tag.name,
              tagType: tag.tagType,
              description: tag.description
            })),
            datasets: input.datasets.map((dataset) => ({
              id: dataset.id,
              name: dataset.name,
              description: dataset.description,
              personTypes: dataset.personTypes,
              customColumns: dataset.customColumns
            })),
            reportingPeriodType: input.reportingPeriodType,
            reportingPeriods: input.reportingPeriods?.map(rp => ({
              range: rp.range,
              programId: programId,
              description: rp.description
            })),
            targets: input.targets.map(target => ({
              id: target.id,
              category: { id: target.category.id, name: target.category.name, description: target.category.description },
              target: target.target,
              tracks: target.tracks.map(track => ({
                id: track.id,
                categoryValue: {
                  id: track.categoryValue.id,
                  name: track.categoryValue.name,
                  category: {
                    id: track.categoryValue.category.id
                  }
                },
                targetMember: track.targetMember
              }))
            }))
          },
        },
        // Reload the dataset in case it's been loaded previously, otherwise the
        // changes won't be reflected if the admin navigates to the dataset page.
        refetchQueries: (result) =>
          result.data?.updateProgram.datasets.map((ds) => ({
            query: GET_DATASET,
            variables: { id: ds.id },
          })) || [],
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
