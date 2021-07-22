import { gql } from "@apollo/client";

export const ALL_DATASETS = gql`
  query AllDatasets {
    teams {
      programs {
        id
        name
        datasets {
          id
          name
          description
          lastUpdated
          records {
            id
            publicationDate
          }
          tags {
            name
          }
        }
      }
    }
  }
`;
