import { gql } from "@apollo/client";

export const GET_BASIC_STATS = gql`
  query GetBasicStats {
    basicStats {
      teams
      datasets
      tags
    }
  }
`;
