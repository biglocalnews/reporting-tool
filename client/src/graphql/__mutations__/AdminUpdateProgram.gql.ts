import { gql } from "@apollo/client";

export const ADMIN_UPDATE_PROGRAM = gql`
  mutation AdminUpdateProgram($input: UpdateProgramInput!) {
    updateProgram(input: $input) {
      id
    }
  }
`;
