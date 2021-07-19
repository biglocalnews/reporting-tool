import { gql } from "@apollo/client";

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      firstName
      lastName
      teams {
        programs {
          id
          name
          datasets {
            id
            name
            description
            lastUpdated
            personTypes
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
