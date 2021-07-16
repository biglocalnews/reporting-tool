/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AdminGetTeam
// ====================================================

export interface AdminGetTeam_team_users {
  readonly __typename: "User";
  readonly id: string;
}

export interface AdminGetTeam_team_programs {
  readonly __typename: "Program";
  readonly id: string;
}

export interface AdminGetTeam_team {
  readonly __typename: "Team";
  readonly name: string;
  readonly users: ReadonlyArray<AdminGetTeam_team_users>;
  readonly programs: ReadonlyArray<AdminGetTeam_team_programs>;
}

export interface AdminGetTeam {
  readonly team: AdminGetTeam_team;
}

export interface AdminGetTeamVariables {
  readonly id: string;
}
