/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AdminGetAllDatasets
// ====================================================

export interface AdminGetAllDatasets_datasets_program {
  readonly __typename: "Program";
  readonly id: string;
}

export interface AdminGetAllDatasets_datasets_tags {
  readonly __typename: "Tag";
  readonly name: string;
  readonly tagType: string;
}

export interface AdminGetAllDatasets_datasets {
  readonly __typename: "Dataset";
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly lastUpdated: any | null;
  readonly program: AdminGetAllDatasets_datasets_program | null;
  readonly tags: ReadonlyArray<AdminGetAllDatasets_datasets_tags>;
}

export interface AdminGetAllDatasets {
  readonly datasets: ReadonlyArray<AdminGetAllDatasets_datasets>;
}

export interface AdminGetAllDatasetsVariables {
  readonly onlyUnassigned?: boolean | null;
}
