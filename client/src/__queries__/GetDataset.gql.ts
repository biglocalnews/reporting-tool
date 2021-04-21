import { gql } from "@apollo/client";

export const GET_DATASET = gql`
  query GetDataset($id: ID!) {
    dataset(id: $id) {
      id
      name
      program {
        name
      }
      records {
        id
        publicationDate
        data {
          id
          category
          categoryValue
          count
        }
      }
    }
  }
`;
