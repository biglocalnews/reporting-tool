/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { UpdateTeamInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AdminUpdateTeam
// ====================================================

export interface AdminUpdateTeam_updateTeam {
  readonly __typename: "Team";
  readonly id: string;
}

export interface AdminUpdateTeam {
  readonly updateTeam: AdminUpdateTeam_updateTeam;
}

export interface AdminUpdateTeamVariables {
  readonly input: UpdateTeamInput;
}
