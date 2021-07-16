import { gql } from "@apollo/client";

export const ADMIN_UPDATE_TEAM = gql`
  mutation AdminUpdateTeam($input: UpdateTeamInput!) {
    updateTeam(input: $input) {
      id
    }
  }
`;
