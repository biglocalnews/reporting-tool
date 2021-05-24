import { gql } from "@apollo/client";

export const GET_DATASET = gql`
  query GetDataset($id: ID!) {
    dataset(id: $id) {
      id
      name
      lastUpdated
      program {
        name
        targets {
          id
          category {
            id
            category
            categoryValue
          }
        }
      }
      records {
        id
        publicationDate
        entries {
          id
          category {
            id
            category
            categoryValue
          }
          count
        }
      }
    }
  }
`;
