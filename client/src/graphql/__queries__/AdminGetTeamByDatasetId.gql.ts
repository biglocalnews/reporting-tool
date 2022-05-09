import { gql } from "@apollo/client";

export const ADMIN_GET_TEAM_BY_DATASET_ID = gql`
  query AdminGetTeamByDatasetId($id: ID!) {
    teamByDatasetId(id: $id) {
      name
      users {
        id
        firstName
        lastName
        email
        roles {
          name
        }
      }
    }
  }
`;
