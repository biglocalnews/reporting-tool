/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetDataset
// ====================================================

export interface GetDataset_dataset_sumOfCategoryValueCounts_categoryValue_category {
  readonly __typename: "Category";
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface GetDataset_dataset_sumOfCategoryValueCounts_categoryValue {
  readonly __typename: "CategoryValue";
  readonly id: string;
  readonly name: string;
  readonly category: GetDataset_dataset_sumOfCategoryValueCounts_categoryValue_category;
}

export interface GetDataset_dataset_sumOfCategoryValueCounts {
  readonly __typename: "SumEntriesByCategoryValue";
  readonly categoryValue: GetDataset_dataset_sumOfCategoryValueCounts_categoryValue;
  readonly sumOfCounts: number;
}

export interface GetDataset_dataset_program_targets_categoryValue_category {
  readonly __typename: "Category";
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface GetDataset_dataset_program_targets_categoryValue {
  readonly __typename: "CategoryValue";
  readonly id: string;
  readonly name: string;
  readonly category: GetDataset_dataset_program_targets_categoryValue_category;
}

export interface GetDataset_dataset_program_targets {
  readonly __typename: "Target";
  readonly id: string;
  readonly target: number;
  readonly categoryValue: GetDataset_dataset_program_targets_categoryValue;
}

export interface GetDataset_dataset_program {
  readonly __typename: "Program";
  readonly name: string;
  readonly targets: ReadonlyArray<GetDataset_dataset_program_targets>;
}

export interface GetDataset_dataset_records_entries_categoryValue_category {
  readonly __typename: "Category";
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface GetDataset_dataset_records_entries_categoryValue {
  readonly __typename: "CategoryValue";
  readonly id: string;
  readonly name: string;
  readonly category: GetDataset_dataset_records_entries_categoryValue_category;
}

export interface GetDataset_dataset_records_entries {
  readonly __typename: "Entry";
  readonly id: string;
  readonly categoryValue: GetDataset_dataset_records_entries_categoryValue;
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
  readonly lastUpdated: any | null;
  readonly personTypes: ReadonlyArray<string> | null;
  readonly sumOfCategoryValueCounts: ReadonlyArray<GetDataset_dataset_sumOfCategoryValueCounts>;
  readonly program: GetDataset_dataset_program;
  readonly records: ReadonlyArray<GetDataset_dataset_records>;
}

export interface GetDataset {
  readonly dataset: GetDataset_dataset;
}

export interface GetDatasetVariables {
  readonly id: string;
}
