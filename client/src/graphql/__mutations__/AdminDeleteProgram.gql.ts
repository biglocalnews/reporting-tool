import { gql } from "@apollo/client";

export const ADMIN_DELETE_PROGRAM = gql`
  mutation AdminDeleteProgram($input: ID!) {
    deleteProgram(id: $input)
  }
`;
