import { gql } from "@apollo/client";

export const UPDATE_RECORD = gql`
  mutation UpdateRecord($input: UpdateRecordInput!) {
    updateRecord(input: $input) {
      id
      publicationDate
      dataset {
        name
      }
      entries {
        id
        category
        categoryValue
        count
      }
    }
  }
`;
