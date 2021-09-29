import { gql } from "@apollo/client";

export const GET_ALL_TAGS = gql`
  query GetAllTags {
    tags {
      id
      name
      tagType
      description
      datasets {
        id
        name
        lastUpdated
      }
      programs {
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
    }
  }
`;
