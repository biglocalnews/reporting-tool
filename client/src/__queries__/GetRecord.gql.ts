import { gql } from "@apollo/client";

export const GET_RECORD = gql`
  query GetRecord($id: ID!) {
    record(id: $id) {
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
