import { gql } from "@apollo/client";

export const CREATE_PUBLISHED_RECORD_SET = gql`
  mutation CreatePublishedRecordSet($input: CreatePublishedRecordSetInput!) {
    createPublishedRecordSet(input: $input) {
      begin
      end
      datasetId
      reportingPeriodId
      document
    }
  }
`;
