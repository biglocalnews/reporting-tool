import { gql } from "@apollo/client";

export const GET_DATASET = gql`
  query GetDataset($id: ID!) {
    dataset(id: $id) {
      id
      name
      lastUpdated
      personTypes {
        id
        personTypeName
      }
      sumOfCategoryValueCounts {
        categoryValue {
          id
          name
          category {
            id
            name
            description
          }
        }
        sumOfCounts
      }
      program {
        name
        targets {
          id
          target
          category {
              id
              name
              description
          }
          tracks {
            targetMember
            categoryValue {
              id
              name
            }
          }
        }
        reportingPeriods {
          id
          range
          description
          
        }       
        tags {
          name
          tagType
        }
      }
      records {
        id
        publicationDate
        entries {
          id
          categoryValue {
            id
            name
            category {
              id
              name
              description
            }
          }
          count
          personType {
            id
            personTypeName
          }
        }
      }
      tags {
        name
        tagType
      }
      publishedRecordSets {
        reportingPeriodId
        begin
        end
        document
      }
    }
  }
`;
