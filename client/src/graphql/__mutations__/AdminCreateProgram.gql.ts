import { gql } from "@apollo/client";

export const ADMIN_CREATE_PROGRAM = gql`
  mutation AdminCreateProgram($input: CreateProgramInput!) {
    createProgram(input: $input) {
      id
    }
  }
`;
