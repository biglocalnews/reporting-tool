/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AdminGetTeamByDatasetId
// ====================================================

export interface AdminGetTeamByDatasetId_teamByDatasetId_users_roles {
  readonly __typename: "Role";
  readonly name: string;
}

export interface AdminGetTeamByDatasetId_teamByDatasetId_users {
  readonly __typename: "User";
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly roles: ReadonlyArray<AdminGetTeamByDatasetId_teamByDatasetId_users_roles>;
}

export interface AdminGetTeamByDatasetId_teamByDatasetId {
  readonly __typename: "Team";
  readonly name: string;
  readonly users: ReadonlyArray<AdminGetTeamByDatasetId_teamByDatasetId_users>;
}

export interface AdminGetTeamByDatasetId {
  readonly teamByDatasetId: AdminGetTeamByDatasetId_teamByDatasetId;
}

export interface AdminGetTeamByDatasetIdVariables {
  readonly id: string;
}
