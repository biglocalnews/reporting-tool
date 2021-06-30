import {
  FetchResult,
  MutationFunction,
  MutationFunctionOptions,
  MutationResult,
  useMutation,
} from "@apollo/client";
import { CREATE_RECORD } from "../../__mutations__/CreateRecord";
import { GET_DATASET } from "../../__queries__/GetDataset.gql";
import { UPDATE_RECORD } from "../../__mutations__/UpdateRecord.gql";
import { GetRecord } from "../../__generated__/GetRecord";
import { UpdateRecord } from "../../__generated__/UpdateRecord";

type CustomMutationHook<T, R extends MutationResult> = (input: T) => R;

interface CreateRecordMutationProps {
  datasetId: string;
}

interface UseCreateRecordResult extends MutationResult<GetRecord> {
  createRecord: MutationFunction;
}

/**
 * Hook wrapper for mutation to create a record
 * @param datasetId string for dataset ID
 */
export const useCreateRecordMutation: CustomMutationHook<
  CreateRecordMutationProps,
  UseCreateRecordResult
> = ({ datasetId }: CreateRecordMutationProps) => {
  const [createRecord, { ...rest }] = useMutation(CREATE_RECORD, {
    awaitRefetchQueries: true,
    refetchQueries: [
      {
        query: GET_DATASET,
        variables: { id: datasetId },
      },
    ],
  });

  // Return mutation function and rest of mutation types
  return { createRecord, ...rest };
};

interface UpdateRecordMutationProps {
  datasetId: string;
}

interface UseUpdateRecordMutation extends MutationResult<UpdateRecord> {
  updateRecord: MutationFunction;
}

/**
 * Hook wrapper for mutation to update a record
 * @param datasetId string for dataset ID
 */
export const useUpdateRecordMutation: CustomMutationHook<
  CreateRecordMutationProps,
  UseUpdateRecordMutation
> = ({ datasetId }: UpdateRecordMutationProps) => {
  const [updateRecord, { ...rest }] = useMutation(UPDATE_RECORD, {
    awaitRefetchQueries: true,
    refetchQueries: [
      {
        query: GET_DATASET,
        variables: { id: datasetId },
      },
    ],
  });

  // Return mutation function and rest of mutation types
  return { updateRecord, ...rest };
};
