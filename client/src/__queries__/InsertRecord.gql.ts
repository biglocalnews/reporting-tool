import { gql } from "@apollo/client";

export const INSERT_RECORD = gql`
  mutation InsertRecord($input: InsertDatasetRecordInput!) {
    insertRecord(input: $input) {
      record {
        id
      }
    }
  }
`;
