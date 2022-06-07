import { gql } from "@apollo/client";

export const ADMIN_GET_TEAM = gql`
  query AdminGetTeam($id: ID!) {
    team(id: $id) {
      name
      users {
        id
      }
      programs {
        id
      }
    }
  }
`;
