/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CustomColumnType } from "./globalTypes";

// ====================================================
// GraphQL query operation: GetRecord
// ====================================================

export interface GetRecord_record_dataset {
  readonly __typename: "Dataset";
  readonly name: string;
}

export interface GetRecord_record_customColumnValues_customColumn {
  readonly __typename: "CustomColumn";
  readonly id: string;
  readonly name: string;
  readonly type: CustomColumnType | null;
  readonly description: string | null;
}

export interface GetRecord_record_customColumnValues {
  readonly __typename: "CustomColumnValue";
  readonly id: string;
  readonly customColumn: GetRecord_record_customColumnValues_customColumn;
  readonly value: string | null;
}

export interface GetRecord_record_entries_categoryValue_category {
  readonly __typename: "Category";
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface GetRecord_record_entries_categoryValue {
  readonly __typename: "CategoryValue";
  readonly id: string;
  readonly name: string;
  readonly category: GetRecord_record_entries_categoryValue_category;
}

export interface GetRecord_record_entries_personType {
  readonly __typename: "PersonType";
  readonly id: string;
  readonly personTypeName: string;
}

export interface GetRecord_record_entries {
  readonly __typename: "Entry";
  readonly id: string;
  readonly categoryValue: GetRecord_record_entries_categoryValue;
  readonly count: number;
  readonly personType: GetRecord_record_entries_personType | null;
}

export interface GetRecord_record {
  readonly __typename: "Record";
  readonly id: string;
  readonly publicationDate: any;
  readonly dataset: GetRecord_record_dataset;
  readonly customColumnValues: ReadonlyArray<GetRecord_record_customColumnValues> | null;
  readonly entries: ReadonlyArray<GetRecord_record_entries>;
}

export interface GetRecord {
  readonly record: GetRecord_record;
}

export interface GetRecordVariables {
  readonly id: string;
}
