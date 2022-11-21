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
        importedId
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
        team {
          name
        }
      }
      records {
        id
        publicationDate
        customColumnValues {
          id
          customColumn {
            id
            name
            type
          }
          value
        }
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
        id
        reportingPeriodId
        begin
        end
        document
      }
      customColumns {
        id
        name
        type
        description
      }
    }
  }
`;
