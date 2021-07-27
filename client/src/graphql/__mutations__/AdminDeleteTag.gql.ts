import { gql } from "@apollo/client";

export const ADMIN_DELETE_TAG = gql`
  mutation AdminDeleteTag($id: ID!) {
    deleteTag(id: $id)
  }
`;
