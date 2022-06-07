import { gql } from "@apollo/client";

export const ADMIN_GET_ALL_TEAMS = gql`
  query AdminGetAllTeams {
    teams {
      id
      name
    }
  }
`;
