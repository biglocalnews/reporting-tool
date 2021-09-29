import { gql } from "@apollo/client";

export const GET_ALL_TEAMS = gql`
  query GetAllTeams {
    teams {
      id
      name
      programs {
        id
        name
        description
        datasets {
          id
          name
          lastUpdated
          tags {
            id
            name
            tagType
            description
          }
        }
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
    }
  }
`;
