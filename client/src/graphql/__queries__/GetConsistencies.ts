import { gql } from "@apollo/client";

export const GET_CONSISTENCIES = gql`
  query GetConsistencies {
    stats {
      consistencies {
        category
        year
        value
        consistencyState
      }
    }
  }
`;
