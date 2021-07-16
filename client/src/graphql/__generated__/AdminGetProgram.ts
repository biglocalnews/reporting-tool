/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AdminGetProgram
// ====================================================

export interface AdminGetProgram_program_team {
  readonly __typename: "Team";
  readonly id: string;
  readonly name: string;
}

export interface AdminGetProgram_program_tags {
  readonly __typename: "Tag";
  readonly id: string;
  readonly name: string;
}

export interface AdminGetProgram_program_datasets {
  readonly __typename: "Dataset";
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
}

export interface AdminGetProgram_program_targets_categoryValue_category {
  readonly __typename: "Category";
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface AdminGetProgram_program_targets_categoryValue {
  readonly __typename: "CategoryValue";
  readonly id: string;
  readonly name: string;
  readonly category: AdminGetProgram_program_targets_categoryValue_category;
}

export interface AdminGetProgram_program_targets {
  readonly __typename: "Target";
  readonly id: string;
  readonly categoryValue: AdminGetProgram_program_targets_categoryValue;
  readonly target: number;
}

export interface AdminGetProgram_program {
  readonly __typename: "Program";
  readonly name: string;
  readonly description: string;
  readonly team: AdminGetProgram_program_team | null;
  readonly deleted: any | null;
  readonly tags: ReadonlyArray<AdminGetProgram_program_tags>;
  readonly datasets: ReadonlyArray<AdminGetProgram_program_datasets>;
  readonly targets: ReadonlyArray<AdminGetProgram_program_targets>;
}

export interface AdminGetProgram {
  readonly program: AdminGetProgram_program;
}

export interface AdminGetProgramVariables {
  readonly id: string;
}
