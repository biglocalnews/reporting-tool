import { gql } from "@apollo/client";

export const ADMIN_SEND_EMAIL = gql`
  mutation ADMIN_SEND_EMAIL($input: SendEmailInput!) {
    sendEmail(input: $input)
  }
`;
