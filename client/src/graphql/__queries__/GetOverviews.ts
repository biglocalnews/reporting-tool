import { gql } from "@apollo/client";

export const GET_OVERVIEWS = gql`
  query GetOverviews {
   
      overviews {
        category
        date
        value
        targetState
        filter
      
    }
  }
`;
