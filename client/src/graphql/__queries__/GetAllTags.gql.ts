import { gql } from "@apollo/client";

export const GET_ALL_TAGS = gql`
  query GetAllTags {
    tags {
      id
      name
      tagType
      description
    }
  }
`;
