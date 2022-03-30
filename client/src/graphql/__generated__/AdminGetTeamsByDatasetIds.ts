/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AdminGetTeamsByDatasetIds
// ====================================================

export interface AdminGetTeamsByDatasetIds_teamsByDatasetIds_users {
  readonly __typename: "User";
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
}

export interface AdminGetTeamsByDatasetIds_teamsByDatasetIds {
  readonly __typename: "Team";
  readonly name: string;
  readonly users: ReadonlyArray<AdminGetTeamsByDatasetIds_teamsByDatasetIds_users>;
}

export interface AdminGetTeamsByDatasetIds {
  readonly teamsByDatasetIds: ReadonlyArray<AdminGetTeamsByDatasetIds_teamsByDatasetIds>;
}

export interface AdminGetTeamsByDatasetIdsVariables {
  readonly ids: ReadonlyArray<string>;
}
