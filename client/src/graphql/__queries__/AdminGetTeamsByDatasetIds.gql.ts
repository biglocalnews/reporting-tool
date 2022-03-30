import { gql } from "@apollo/client";

export const ADMIN_GET_TEAMS_BY_DATASET_IDS = gql`
  query AdminGetTeamsByDatasetIds($ids: [ID!]!) {
    teamsByDatasetIds(ids: $ids) {
      name
      users {
        id
        firstName
        lastName
        email
      }
    }
  }
`;
