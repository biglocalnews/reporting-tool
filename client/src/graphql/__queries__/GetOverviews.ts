import { gql } from "@apollo/client";

export const GET_OVERVIEWS = gql`
  query GetOverviews {
    stats {
      overviews {
        category
        date
        value
        targetState
        filter
      }
    }
  }
`;
