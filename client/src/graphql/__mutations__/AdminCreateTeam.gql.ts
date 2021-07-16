import { gql } from "@apollo/client";

export const ADMIN_CREATE_TEAM = gql`
  mutation AdminCreateTeam($input: CreateTeamInput!) {
    createTeam(input: $input) {
      id
    }
  }
`;
