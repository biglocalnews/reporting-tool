import { gql } from "@apollo/client";

export const FIRST_TIME_CONFIGURE = gql`
  mutation FirstTimeConfigure($input: FirstTimeAppConfigurationInput!) {
    configureApp(input: $input)
  }
`;
