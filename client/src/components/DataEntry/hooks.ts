import { useMutation } from "@apollo/client";
import { CREATE_RECORD } from "../../__mutations__/CreateRecord";
import { GET_DATASET } from "../../__queries__/GetDataset.gql";
import { UPDATE_RECORD } from "../../__mutations__/UpdateRecord.gql";

interface CreateRecordMutationProps {
  datasetId: string;
}

export const useCreateRecordMutation = ({
  datasetId,
}: CreateRecordMutationProps) => {
  const [
    createRecord,
    {
      data: newRecordData,
      loading: loadingRecordCreation,
      error: errorOnCreate,
    },
  ] = useMutation(CREATE_RECORD, {
    awaitRefetchQueries: true,
    refetchQueries: [
      {
        query: GET_DATASET,
        variables: { id: datasetId },
      },
    ],
  });
  return { createRecord, newRecordData, loadingRecordCreation, errorOnCreate };
};

interface UpdateRecordMutationProps {
  datasetId: string;
}

export const useUpdateRecordMutation = ({
  datasetId,
}: UpdateRecordMutationProps) => {
  const [
    updateRecord,
    {
      data: updatedRecordData,
      loading: loadingRecordUpdate,
      error: errorOnRecordUpdate,
    },
  ] = useMutation(UPDATE_RECORD, {
    awaitRefetchQueries: true,
    refetchQueries: [
      {
        query: GET_DATASET,
        variables: { id: datasetId },
      },
    ],
  });

  return {
    updateRecord,
    updatedRecordData,
    loadingRecordUpdate,
    errorOnRecordUpdate,
  };
};
