/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetDataset
// ====================================================

export interface GetDataset_dataset_personTypes {
  readonly __typename: "PersonType";
  readonly id: string;
  readonly personTypeName: string;
}

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

export interface GetDataset_dataset_program_targets_category {
  readonly __typename: "Category";
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface GetDataset_dataset_program_targets_tracks_categoryValue {
  readonly __typename: "CategoryValue";
  readonly id: string;
  readonly name: string;
}

export interface GetDataset_dataset_program_targets_tracks {
  readonly __typename: "Track";
  readonly targetMember: boolean;
  readonly categoryValue: GetDataset_dataset_program_targets_tracks_categoryValue;
}

export interface GetDataset_dataset_program_targets {
  readonly __typename: "Target";
  readonly id: string;
  readonly target: number;
  readonly category: GetDataset_dataset_program_targets_category;
  readonly tracks: ReadonlyArray<GetDataset_dataset_program_targets_tracks>;
}

export interface GetDataset_dataset_program_reportingPeriods {
  readonly __typename: "ReportingPeriod";
  readonly range: ReadonlyArray<any>;
  readonly description: string | null;
}

export interface GetDataset_dataset_program_tags {
  readonly __typename: "Tag";
  readonly name: string;
  readonly tagType: string;
}

export interface GetDataset_dataset_program {
  readonly __typename: "Program";
  readonly name: string;
  readonly targets: ReadonlyArray<GetDataset_dataset_program_targets>;
  readonly reportingPeriods: ReadonlyArray<GetDataset_dataset_program_reportingPeriods> | null;
  readonly tags: ReadonlyArray<GetDataset_dataset_program_tags>;
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

export interface GetDataset_dataset_records_entries_personType {
  readonly __typename: "PersonType";
  readonly id: string;
  readonly personTypeName: string;
}

export interface GetDataset_dataset_records_entries {
  readonly __typename: "Entry";
  readonly id: string;
  readonly categoryValue: GetDataset_dataset_records_entries_categoryValue;
  readonly count: number;
  readonly personType: GetDataset_dataset_records_entries_personType | null;
}

export interface GetDataset_dataset_records {
  readonly __typename: "Record";
  readonly id: string;
  readonly publicationDate: any;
  readonly entries: ReadonlyArray<GetDataset_dataset_records_entries>;
}

export interface GetDataset_dataset_tags {
  readonly __typename: "Tag";
  readonly name: string;
  readonly tagType: string;
}

export interface GetDataset_dataset {
  readonly __typename: "Dataset";
  readonly id: string;
  readonly name: string;
  readonly lastUpdated: any | null;
  readonly personTypes: ReadonlyArray<GetDataset_dataset_personTypes>;
  readonly sumOfCategoryValueCounts: ReadonlyArray<GetDataset_dataset_sumOfCategoryValueCounts>;
  readonly program: GetDataset_dataset_program;
  readonly records: ReadonlyArray<GetDataset_dataset_records>;
  readonly tags: ReadonlyArray<GetDataset_dataset_tags>;
}

export interface GetDataset {
  readonly dataset: GetDataset_dataset;
}

export interface GetDatasetVariables {
  readonly id: string;
}
