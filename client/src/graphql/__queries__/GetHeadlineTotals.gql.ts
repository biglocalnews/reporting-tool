import { gql } from "@apollo/client";

export const GET_HEADLINE_TOTALS = gql`
  query GetHeadlineTotals {
    headlineTotals {
      gender
      ethnicity
      disability
      lgbtqa
    }
  }
`;
