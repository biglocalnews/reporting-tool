import { gql } from "@apollo/client";

export const ADMIN_GET_ALL_PROGRAMS = gql`
  query AdminGetAllPrograms {
    programs {
      id
      name
      deleted
      team {
        id
        name
      }
      tags {
        id
        name
      }
      targets {
          category {
            name
          }       
      }
    }
  }
`;
