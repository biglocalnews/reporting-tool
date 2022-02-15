import { gql } from "@apollo/client";

export const GET_ADMIN_STATS = gql`
  query GetAdminStats {
    adminStats {
      targetStates {
        category
        date
        id
        name
        state
      }
    }
  }
`;
