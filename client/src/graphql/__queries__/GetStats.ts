import { gql } from "@apollo/client";

export const GET_STATS = gql`
  query GetStats {
    stats {
      teams
      datasets
      tags
      gender
      ethnicity
      disability
      lgbtqa
      consistencies {
        category
        year
        value
        consistencyState
      }
    }
  }
`;
