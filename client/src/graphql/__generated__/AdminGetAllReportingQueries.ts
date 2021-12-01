/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AdminGetAllReportingQueries
// ====================================================

export interface AdminGetAllReportingQueries_categoriesOverview {
  readonly __typename: "CategoryOverview";
  readonly id: string;
  readonly name: string;
}

export interface AdminGetAllReportingQueries {
  readonly categoriesOverview: ReadonlyArray<AdminGetAllReportingQueries_categoriesOverview>;
}
