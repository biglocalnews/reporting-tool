import { gql } from "@apollo/client";

export const GET_ALL_PUBLISHED_RECORD_SETS = gql`
  query GetAllPublishedRecordSets($input: PublishedRecordSetsInput!) {
    publishedRecordSets(input: $input) {
      id
      begin
      end
      document
      datasetId
    }
  }
`;
