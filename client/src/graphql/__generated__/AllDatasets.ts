/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AllDatasets
// ====================================================

export interface AllDatasets_teams_programs_datasets_records {
  readonly __typename: "Record";
  readonly id: string;
  readonly publicationDate: any;
}

export interface AllDatasets_teams_programs_datasets_tags {
  readonly __typename: "Tag";
  readonly name: string;
  readonly tagType: string;
}

export interface AllDatasets_teams_programs_datasets {
  readonly __typename: "Dataset";
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly lastUpdated: any | null;
  readonly records: ReadonlyArray<AllDatasets_teams_programs_datasets_records>;
  readonly tags: ReadonlyArray<AllDatasets_teams_programs_datasets_tags>;
}

export interface AllDatasets_teams_programs_tags {
  readonly __typename: "Tag";
  readonly name: string;
  readonly tagType: string;
}

export interface AllDatasets_teams_programs {
  readonly __typename: "Program";
  readonly id: string;
  readonly name: string;
  readonly datasets: ReadonlyArray<AllDatasets_teams_programs_datasets>;
  readonly tags: ReadonlyArray<AllDatasets_teams_programs_tags>;
}

export interface AllDatasets_teams {
  readonly __typename: "Team";
  readonly programs: ReadonlyArray<AllDatasets_teams_programs>;
}

export interface AllDatasets {
  readonly teams: ReadonlyArray<AllDatasets_teams>;
}
