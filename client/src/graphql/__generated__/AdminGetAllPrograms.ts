/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AdminGetAllPrograms
// ====================================================

export interface AdminGetAllPrograms_programs_team {
  readonly __typename: "Team";
  readonly id: string;
  readonly name: string;
}

export interface AdminGetAllPrograms_programs_tags {
  readonly __typename: "Tag";
  readonly id: string;
  readonly name: string;
}

export interface AdminGetAllPrograms_programs_targets_categoryValue_category {
  readonly __typename: "Category";
  readonly name: string;
}

export interface AdminGetAllPrograms_programs_targets_categoryValue {
  readonly __typename: "CategoryValue";
  readonly category: AdminGetAllPrograms_programs_targets_categoryValue_category;
}

export interface AdminGetAllPrograms_programs_targets {
  readonly __typename: "Target";
  readonly categoryValue: AdminGetAllPrograms_programs_targets_categoryValue;
}

export interface AdminGetAllPrograms_programs {
  readonly __typename: "Program";
  readonly id: string;
  readonly name: string;
  readonly deleted: any | null;
  readonly team: AdminGetAllPrograms_programs_team;
  readonly tags: ReadonlyArray<AdminGetAllPrograms_programs_tags>;
  readonly targets: ReadonlyArray<AdminGetAllPrograms_programs_targets>;
}

export interface AdminGetAllPrograms {
  readonly programs: ReadonlyArray<AdminGetAllPrograms_programs>;
}
