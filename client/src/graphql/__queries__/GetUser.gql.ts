import { gql } from "@apollo/client";

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      firstName
      lastName
      teams {
        name
        programs {
          id
          name
          datasets {
            id
            name
            description
            lastUpdated
            records {
              id
              publicationDate
            }
            tags {
              name
            }
          }
        }
      }
    }
  }
`;
