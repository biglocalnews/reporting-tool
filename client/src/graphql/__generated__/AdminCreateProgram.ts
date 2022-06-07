/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CreateProgramInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AdminCreateProgram
// ====================================================

export interface AdminCreateProgram_createProgram {
  readonly __typename: "Program";
  readonly id: string;
}

export interface AdminCreateProgram {
  readonly createProgram: AdminCreateProgram_createProgram;
}

export interface AdminCreateProgramVariables {
  readonly input: CreateProgramInput;
}
