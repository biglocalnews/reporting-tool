/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetDataset
// ====================================================

export interface GetDataset_dataset_program {
  readonly __typename: "Program";
  readonly name: string;
}

export interface GetDataset_dataset_records_entries {
  readonly __typename: "Entry";
  readonly id: string;
  readonly category: string;
  readonly categoryValue: string;
  readonly count: number;
}

export interface GetDataset_dataset_records {
  readonly __typename: "Record";
  readonly id: string;
  readonly publicationDate: any;
  readonly entries: ReadonlyArray<GetDataset_dataset_records_entries>;
}

export interface GetDataset_dataset {
  readonly __typename: "Dataset";
  readonly id: string;
  readonly name: string;
  readonly program: GetDataset_dataset_program;
  readonly records: ReadonlyArray<GetDataset_dataset_records>;
}

export interface GetDataset {
  readonly dataset: GetDataset_dataset;
}

export interface GetDatasetVariables {
  readonly id: string;
}
