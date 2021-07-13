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
      }
      datasets {
        id
        name
        description
      }
      targets {
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
        target
      }
    }
  }
`;
