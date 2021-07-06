import { gql } from "@apollo/client";

export const GET_USER_LIST = gql`
  query GetUserList {
    users {
      id
      firstName
      lastName
      email
      active
      roles {
        name
      }
    }
  }
`;
