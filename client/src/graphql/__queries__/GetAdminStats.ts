import { gql } from "@apollo/client";

export const GET_ADMIN_STATS = gql`
  query GetAdminStats($input: AdminStatsInput) {
    adminStats(input: $input) {
      targetStates {
        category
        date
        prs_id
        name
        state
        percent
        target
        dataset_id
      }
    }
  }
`;
