/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetAllDatasets
// ====================================================

export interface GetAllDatasets_datasets_tags {
  readonly __typename: "Tag";
  readonly id: string;
  readonly name: string;
  readonly tagType: string;
  readonly description: string | null;
}

export interface GetAllDatasets_datasets_personTypes {
  readonly __typename: "PersonType";
  readonly id: string;
  readonly personTypeName: string;
}

export interface GetAllDatasets_datasets_sumOfCategoryValueCounts_categoryValue_category {
  readonly __typename: "Category";
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface GetAllDatasets_datasets_sumOfCategoryValueCounts_categoryValue {
  readonly __typename: "CategoryValue";
  readonly id: string;
  readonly name: string;
  readonly category: GetAllDatasets_datasets_sumOfCategoryValueCounts_categoryValue_category;
}

export interface GetAllDatasets_datasets_sumOfCategoryValueCounts {
  readonly __typename: "SumEntriesByCategoryValue";
  readonly categoryValue: GetAllDatasets_datasets_sumOfCategoryValueCounts_categoryValue;
  readonly sumOfCounts: number;
}

export interface GetAllDatasets_datasets_program_targets_categoryValue_category {
  readonly __typename: "Category";
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface GetAllDatasets_datasets_program_targets_categoryValue {
  readonly __typename: "CategoryValue";
  readonly id: string;
  readonly name: string;
  readonly category: GetAllDatasets_datasets_program_targets_categoryValue_category;
}

export interface GetAllDatasets_datasets_program_targets {
  readonly __typename: "Target";
  readonly id: string;
  readonly target: number;
  readonly categoryValue: GetAllDatasets_datasets_program_targets_categoryValue;
}

export interface GetAllDatasets_datasets_program {
  readonly __typename: "Program";
  readonly name: string;
  readonly targets: ReadonlyArray<GetAllDatasets_datasets_program_targets>;
}

export interface GetAllDatasets_datasets_records_entries_categoryValue_category {
  readonly __typename: "Category";
  readonly id: string;
  readonly name: string;
}

export interface GetAllDatasets_datasets_records_entries_categoryValue {
  readonly __typename: "CategoryValue";
  readonly id: string;
  readonly name: string;
  readonly category: GetAllDatasets_datasets_records_entries_categoryValue_category;
}

export interface GetAllDatasets_datasets_records_entries_personType {
  readonly __typename: "PersonType";
  readonly id: string;
  readonly personTypeName: string;
}

export interface GetAllDatasets_datasets_records_entries {
  readonly __typename: "Entry";
  readonly id: string;
  readonly categoryValue: GetAllDatasets_datasets_records_entries_categoryValue;
  readonly count: number;
  readonly personType: GetAllDatasets_datasets_records_entries_personType | null;
}

export interface GetAllDatasets_datasets_records {
  readonly __typename: "Record";
  readonly id: string;
  readonly publicationDate: any;
  readonly entries: ReadonlyArray<GetAllDatasets_datasets_records_entries>;
}

export interface GetAllDatasets_datasets {
  readonly __typename: "Dataset";
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly lastUpdated: any | null;
  readonly tags: ReadonlyArray<GetAllDatasets_datasets_tags>;
  readonly personTypes: ReadonlyArray<GetAllDatasets_datasets_personTypes>;
  readonly sumOfCategoryValueCounts: ReadonlyArray<GetAllDatasets_datasets_sumOfCategoryValueCounts>;
  readonly program: GetAllDatasets_datasets_program;
  readonly records: ReadonlyArray<GetAllDatasets_datasets_records>;
}

export interface GetAllDatasets {
  readonly datasets: ReadonlyArray<GetAllDatasets_datasets>;
}
