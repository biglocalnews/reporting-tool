import { DELETE_RECORD } from "../__queries__/DeleteRecord.gql";
import { GET_DATASET } from "../__queries__/GetDataset.gql";

const datasetId = "5a8ee1d5-2b5a-49db-b466-68fe50a27cdb";
const recordId = "05caae8d-bb1a-416e-9dda-bb251fe474ff";

export const deleteRecordMutationFixture = {
  request: {
    query: DELETE_RECORD,
    variables: { id: recordId },
  },
  result: {
    data: {
      id: recordId,
      __typename: "DeleteDatasetRecordOutput",
    },
  },
};

export const getDatasetQueryFixture = {
  request: {
    query: GET_DATASET,
    variables: { id: datasetId },
  },
  result: {
    data: {
      dataset: {
        id: datasetId,
        name: "Breakfast Hour",
        program: {
          name: "BBC News",
          __typename: "Program",
        },
        records: [
          {
            id: recordId,
            publicationDate: "2020-12-20",
            data: [
              {
                id: "1",
                category: "gender",
                categoryValue: "men",
                count: 0,
                __typename: "Data",
              },
              {
                id: "2",
                category: "gender",
                categoryValue: "non-binary",
                count: 0,
                __typename: "Data",
              },
              {
                id: "3",
                category: "gender",
                categoryValue: "women",
                count: 5,
                __typename: "Data",
              },
              {
                id: "4",
                category: "gender",
                categoryValue: "gender non-conforming",
                count: 0,
                __typename: "Data",
              },
              {
                id: "5",
                category: "gender",
                categoryValue: "cisgender",
                count: 0,
                __typename: "Data",
              },
              {
                id: "6",
                category: "gender",
                categoryValue: "transgender",
                count: 0,
                __typename: "Data",
              },
            ],
            __typename: "Record",
          },
        ],
        __typename: "Dataset",
      },
    },
  },
};
