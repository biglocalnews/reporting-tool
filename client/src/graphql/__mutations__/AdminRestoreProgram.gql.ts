import { gql } from "@apollo/client";

export const ADMIN_RESTORE_PROGRAM = gql`
  mutation AdminRestoreProgram($input: ID!) {
    restoreProgram(id: $input) {
      id
    }
  }
`;
