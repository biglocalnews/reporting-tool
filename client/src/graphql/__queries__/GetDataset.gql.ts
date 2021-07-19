import { gql } from "@apollo/client";

export const GET_DATASET = gql`
  query GetDataset($id: ID!) {
    dataset(id: $id) {
      id
      name
      lastUpdated
      personTypes {
        id
        person_type_name
      }
      sumOfCategoryValueCounts {
        categoryValue {
          id
          name
          category {
            id
            name
            description
          }
        }
        sumOfCounts
      }
      program {
        name
        targets {
          id
          target
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
          personType {
            id
            person_type_name
          }
        }
      }
    }
  }
`;
