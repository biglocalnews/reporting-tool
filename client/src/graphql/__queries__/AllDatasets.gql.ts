import { gql } from "@apollo/client";

export const ALL_DATASETS = gql`
  query AllDatasets {
    teams {
      programs {
        id
        importedId
        name
        deleted
        datasets {
          id
          name
          description
          lastUpdated
          deleted
          records {
            id
            publicationDate
          }
          tags {
            name
            tagType
          }
        }
        tags {
          name
          tagType
        }
      }
    }
  }
`;
