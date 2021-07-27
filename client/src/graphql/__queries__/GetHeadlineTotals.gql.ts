import { gql } from "@apollo/client";

export const GET_HEADLINE_TOTALS = gql`
  query GetHeadlineTotals {
    headlineTotals {
      gender {
        percent
        noOfDatasets
      }
      ethnicity {
        percent
        noOfDatasets
      }
      disability {
        percent
        noOfDatasets
      }
      lgbtqa {
        percent
        noOfDatasets
      }
    }
  }
`;
