import { gql } from "@apollo/client";

export const GET_RECORD = gql`
  query GetRecord($id: ID!) {
    record(id: $id) {
      id
      publicationDate
      dataset {
        name
      }
      customColumnValues {
        id
        customColumn {
          id
          name
          type
          description
        }
        value
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
        personType {
          id
          personTypeName
        }
      }
    }
  }
`;
