import { gql } from "@apollo/client";

export const DELETE_RECORD = gql`
  mutation DeleteRecord($input: ID!) {
    deleteRecord(input: $input) {
      id
    }
  }
`;
