import { gql } from "@apollo/client";

export const ADMIN_UPDATE_TAG = gql`
  mutation AdminUpdateTag($input: UpdateTagInput!) {
    updateTag(input: $input) {
      id
      tagType
      name
      description
    }
  }
`;