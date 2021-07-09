/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: AdminRestoreProgram
// ====================================================

export interface AdminRestoreProgram_restoreProgram {
  readonly __typename: "Program";
  readonly id: string;
}

export interface AdminRestoreProgram {
  readonly restoreProgram: AdminRestoreProgram_restoreProgram;
}

export interface AdminRestoreProgramVariables {
  readonly input: string;
}
