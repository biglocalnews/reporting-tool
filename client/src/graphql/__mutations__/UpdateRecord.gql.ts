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
        categoryValue {
          id
          name
          category {
            id
            name
            description
          }
        }
        count
      }
    }
  }
`;
