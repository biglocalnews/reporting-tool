import { gql } from "@apollo/client";

export const ADMIN_DELETE_TEAM = gql`
  mutation AdminDeleteTeam($id: ID!) {
    deleteTeam(id: $id)
  }
`;
