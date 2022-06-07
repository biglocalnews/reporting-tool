import { gql } from "@apollo/client";

export const ADMIN_GET_ALL_CATEGORIES = gql`
  query AdminGetAllCategories {
    categories {
      id
      name
      description
      categoryValues {
        name
      }
    }
  }
`;
