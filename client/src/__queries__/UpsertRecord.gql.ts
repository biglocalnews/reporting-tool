import { gql } from "@apollo/client";

export const UPSERT_RECORD = gql`
  mutation UpsertRecord($input: UpsertDatasetRecordInput!) {
    upsertRecord(input: $input) {
      record {
        id
      }
    }
  }
`;
