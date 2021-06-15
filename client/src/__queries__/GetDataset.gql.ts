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
          categoryValue {
            id
            name
            category {
              id
              name
              description
            }
          }
        }
      }
      records {
        id
        publicationDate
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
  }
`;
