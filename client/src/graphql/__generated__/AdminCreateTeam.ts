/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CreateTeamInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AdminCreateTeam
// ====================================================

export interface AdminCreateTeam_createTeam {
  readonly __typename: "Team";
  readonly id: string;
}

export interface AdminCreateTeam {
  readonly createTeam: AdminCreateTeam_createTeam;
}

export interface AdminCreateTeamVariables {
  readonly input: CreateTeamInput;
}
