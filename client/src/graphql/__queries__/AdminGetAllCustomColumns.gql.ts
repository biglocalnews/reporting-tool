import { gql } from "@apollo/client";

export const ADMIN_GET_ALL_CUSTOM_COLUMNS = gql`
  query AdminGetAllCustomColumns {
    customColumns {
      id
      name
      type
      description
    }
  }
`;
