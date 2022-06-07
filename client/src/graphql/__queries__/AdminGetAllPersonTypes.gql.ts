import { gql } from "@apollo/client";

export const ADMIN_GET_ALL_PERSON_TYPES = gql`
  query AdminGetAllPersonTypes {
    personTypes {
      id
      personTypeName
    }
  }
`;
