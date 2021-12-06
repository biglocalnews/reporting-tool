import { gql } from "@apollo/client";

export const CREATE_RECORD = gql`
  mutation CreatePublishedRecordSet($input: CreatePublishedRecordSetInput!) {
    createPublishedRecordSet(input: $input) {
      begin
      end
      datasetId
    }
  }
`;
