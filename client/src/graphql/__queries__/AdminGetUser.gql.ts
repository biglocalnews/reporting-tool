import { gql } from "@apollo/client";

export const ADMIN_GET_USER = gql`
  query AdminGetUser($id: ID!) {
    user(id: $id) {
      email
      username
      firstName
      lastName
      active
      teams {
        id
        name
      }
      roles {
        id
        name
      }
    }
  }
`;
