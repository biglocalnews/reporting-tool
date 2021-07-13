/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { UpdateProgramInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AdminUpdateProgram
// ====================================================

export interface AdminUpdateProgram_updateProgram {
  readonly __typename: "Program";
  readonly id: string;
}

export interface AdminUpdateProgram {
  readonly updateProgram: AdminUpdateProgram_updateProgram;
}

export interface AdminUpdateProgramVariables {
  readonly input: UpdateProgramInput;
}
