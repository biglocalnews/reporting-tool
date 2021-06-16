/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetRecord
// ====================================================

export interface GetRecord_record_dataset {
  readonly __typename: "Dataset";
  readonly name: string;
}

export interface GetRecord_record_entries_category {
  readonly __typename: "Category";
  readonly id: string;
  readonly description: string;
  readonly category: string;
  readonly categoryValue: string;
}

export interface GetRecord_record_entries {
  readonly __typename: "Entry";
  readonly id: string;
  readonly category: GetRecord_record_entries_category;
  readonly count: number;
}

export interface GetRecord_record {
  readonly __typename: "Record";
  readonly id: string;
  readonly publicationDate: any;
  readonly dataset: GetRecord_record_dataset;
  readonly entries: ReadonlyArray<GetRecord_record_entries>;
}

export interface GetRecord {
  readonly record: GetRecord_record;
}

export interface GetRecordVariables {
  readonly id: string;
}
