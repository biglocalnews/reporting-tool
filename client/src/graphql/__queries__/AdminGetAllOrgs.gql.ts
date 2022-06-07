import { gql } from "@apollo/client";

export const ADMIN_GET_ALL_ORGS = gql`
  query AdminGetAllOrgs {
    organizations {
      id
      name
    }
  }
`;
