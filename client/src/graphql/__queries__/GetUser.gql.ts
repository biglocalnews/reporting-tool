import { gql } from "@apollo/client";

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      firstName
      lastName
      teams {
        id
        name
        programs {
          id
          importedId
          name
          deleted
          datasets {
            id
            name
            description
            lastUpdated
            deleted
            records {
              id
              publicationDate
            }
            tags {
              name
              tagType
            }
          }
          tags{
            name
            tagType
          }
        }
      }
    }
  }
`;
