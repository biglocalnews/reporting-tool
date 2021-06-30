import { gql } from "@apollo/client";

export const CREATE_RECORD = gql`
  mutation CreateRecord($input: CreateRecordInput!) {
    createRecord(input: $input) {
      id
      publicationDate
      dataset {
        name
      }
    }
  }
`;
