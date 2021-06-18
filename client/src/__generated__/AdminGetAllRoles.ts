/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AdminGetAllRoles
// ====================================================

export interface AdminGetAllRoles_roles {
  readonly __typename: "Role";
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface AdminGetAllRoles {
  readonly roles: ReadonlyArray<AdminGetAllRoles_roles>;
}
