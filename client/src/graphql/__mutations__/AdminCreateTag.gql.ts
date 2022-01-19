import { gql } from "@apollo/client";

export const ADMIN_CREATE_TAG = gql`
  mutation AdminCreateTag($input: CreateTagInput!) {
    createTag(input: $input) {
      tagType
      name
      description
    }
  }
`;