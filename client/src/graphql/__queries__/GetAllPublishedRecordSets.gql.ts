import { gql } from "@apollo/client";

export const GET_ALL_PUBLISHED_RECORD_SETS = gql`
  query GetAllPublishedRecordSets {
    publishedRecordSets {
      id
      begin
      end
    }
  }
`;
