/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetAllTeams
// ====================================================

export interface GetAllTeams_teams_programs_datasets_tags {
  readonly __typename: "Tag";
  readonly id: string;
  readonly name: string;
  readonly tagType: string;
  readonly description: string | null;
}

export interface GetAllTeams_teams_programs_datasets {
  readonly __typename: "Dataset";
  readonly id: string;
  readonly name: string;
  readonly lastUpdated: any | null;
  readonly tags: ReadonlyArray<GetAllTeams_teams_programs_datasets_tags>;
}

export interface GetAllTeams_teams_programs_targets_categoryValue_category {
  readonly __typename: "Category";
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface GetAllTeams_teams_programs_targets_categoryValue {
  readonly __typename: "CategoryValue";
  readonly id: string;
  readonly name: string;
  readonly category: GetAllTeams_teams_programs_targets_categoryValue_category;
}

export interface GetAllTeams_teams_programs_targets {
  readonly __typename: "Target";
  readonly id: string;
  readonly target: number;
  readonly categoryValue: GetAllTeams_teams_programs_targets_categoryValue;
}

export interface GetAllTeams_teams_programs {
  readonly __typename: "Program";
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly datasets: ReadonlyArray<GetAllTeams_teams_programs_datasets>;
  readonly targets: ReadonlyArray<GetAllTeams_teams_programs_targets>;
}

export interface GetAllTeams_teams {
  readonly __typename: "Team";
  readonly id: string;
  readonly name: string;
  readonly programs: ReadonlyArray<GetAllTeams_teams_programs>;
}

export interface GetAllTeams {
  readonly teams: ReadonlyArray<GetAllTeams_teams>;
}
