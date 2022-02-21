import { gql } from "@apollo/client";

export const GET_ADMIN_STATS = gql`
  query GetAdminStats($input: AdminStatsInput) {
    adminStats(input: $input) {
      targetStates {
        category
        reportingPeriodEnd
        prsId
        name
        state
        percent
        target
        datasetId
      }
      overdue {
        reportingPeriodEnd
        name
        datasetId
        reportingPeriodName
      }
    }
  }
`;
