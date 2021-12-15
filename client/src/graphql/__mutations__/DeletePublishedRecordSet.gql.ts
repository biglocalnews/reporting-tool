import { gql } from "@apollo/client";

export const DELETE_PUBLISHED_RECORD_SET = gql`
  mutation DeletePublishedRecordSet($id: ID!) {
    deletePublishedRecordSet(id: $id)
  }
`;
