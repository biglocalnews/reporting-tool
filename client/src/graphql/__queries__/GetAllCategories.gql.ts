import { gql } from "@apollo/client";

export const GET_ALL_CATEGORIES = gql`
  query GetAllCategories {
    categories {
      id
      name
      description
      categoryValues {
        id
        name
      }
    }
  }
`;
