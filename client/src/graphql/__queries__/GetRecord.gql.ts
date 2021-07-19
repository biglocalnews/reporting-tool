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
        personType
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
        personType {
          id
          person_type_name
        }
      }
    }
  }
`;
