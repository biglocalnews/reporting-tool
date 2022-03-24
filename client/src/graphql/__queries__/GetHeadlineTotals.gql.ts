import { gql } from "@apollo/client";

export const GET_HEADLINE_TOTALS = gql`
  query GetHeadlineTotals {
    stats {
      gender
      ethnicity
      disability
      lgbtqa
    }
  }
`;
