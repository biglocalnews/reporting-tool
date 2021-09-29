import { gql } from "@apollo/client";

export const GET_ALL_DATASETS = gql`
  query GetAllDatasets {
    datasets {
      id
      name
      description
      lastUpdated
      tags {
        id
        name
        tagType
        description
      }
      personTypes {
        id
        personTypeName
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
  }
`;
