import { gql } from "@apollo/client";

export const GET_DATASET = gql`
  query GetDataset($id: ID!) {
    dataset(id: $id) {
      id
      name
      lastUpdated
      program {
        name
      }
      records {
        id
        publicationDate
        entries {
          id
          category
          categoryValue
          count
        }
      }
    }
  }
`;
