import { gql } from "@apollo/client";

export const ADMIN_GET_ALL_ROLES = gql`
  query AdminGetAllRoles {
    roles {
      id
      name
      description
    }
  }
`;
