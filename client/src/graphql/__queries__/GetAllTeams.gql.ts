import { gql } from "@apollo/client";

export const GET_ALL_TEAMS = gql`
  query GetAllTeams {
    teams {
      id
      name
      datasets {
        id
        name
        lastUpdated
      }
      programs {
        id
        name
        description
        targets {
          id
          target
          categoryValue {
            id
            name
            category {
              id
              name
              description
            }
          }
        }
      }
      tags {
        id
        name
        tagType
        description
      }
    }
  }
`;
