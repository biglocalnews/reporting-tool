import { gql } from "@apollo/client";

export const ADMIN_GET_ALL_REPORTING_QUERIES = gql`
  query AdminGetAllReportingQueries {
    categoriesOverview {
      id
      name
    }
  }
`;
