import { gql } from "@apollo/client";

export const ADMIN_GET_PROGRAM = gql`
  query AdminGetProgram($id: ID!) {
    program(id: $id) {
      name
      description
      team {
        id
        name
      }
      deleted
      tags {
        id
        name
        tagType
        description
      }
      datasets {
        id
        name
        description
        personTypes {
          id
          personTypeName
        }
        customColumns {
          id
          name
          type
          description
        }
      }
      reportingPeriodType
      reportingPeriods {
        id
        begin
        end
        range
        description
      }
      targets {
        id
        category {
          id
          name
          description
        }        
        target
        tracks {
          id
          targetMember
          categoryValue {
            id
            name
            category {
              id
            }
          }
        }
      }
    }
  }
`;
