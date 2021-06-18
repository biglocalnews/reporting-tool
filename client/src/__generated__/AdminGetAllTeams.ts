/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AdminGetAllTeams
// ====================================================

export interface AdminGetAllTeams_teams {
  readonly __typename: "Team";
  readonly id: string;
  readonly name: string;
}

export interface AdminGetAllTeams {
  readonly teams: ReadonlyArray<AdminGetAllTeams_teams>;
}
