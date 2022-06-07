/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AdminGetAllOrgs
// ====================================================

export interface AdminGetAllOrgs_organizations {
  readonly __typename: "Organization";
  readonly id: string;
  readonly name: string;
}

export interface AdminGetAllOrgs {
  readonly organizations: ReadonlyArray<AdminGetAllOrgs_organizations>;
}
