/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { UpdateRecordInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateRecord
// ====================================================

export interface UpdateRecord_updateRecord_dataset {
  readonly __typename: "Dataset";
  readonly name: string;
}

export interface UpdateRecord_updateRecord_customColumnValues_customColumn {
  readonly __typename: "CustomColumn";
  readonly id: string;
}

export interface UpdateRecord_updateRecord_customColumnValues {
  readonly __typename: "CustomColumnValue";
  readonly id: string;
  readonly customColumn: UpdateRecord_updateRecord_customColumnValues_customColumn;
  readonly value: string | null;
}

export interface UpdateRecord_updateRecord_entries_categoryValue_category {
  readonly __typename: "Category";
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface UpdateRecord_updateRecord_entries_categoryValue {
  readonly __typename: "CategoryValue";
  readonly id: string;
  readonly name: string;
  readonly category: UpdateRecord_updateRecord_entries_categoryValue_category;
}

export interface UpdateRecord_updateRecord_entries {
  readonly __typename: "Entry";
  readonly id: string;
  readonly categoryValue: UpdateRecord_updateRecord_entries_categoryValue;
  readonly count: number;
}

export interface UpdateRecord_updateRecord {
  readonly __typename: "Record";
  readonly id: string;
  readonly publicationDate: any;
  readonly dataset: UpdateRecord_updateRecord_dataset;
  readonly customColumnValues: ReadonlyArray<UpdateRecord_updateRecord_customColumnValues> | null;
  readonly entries: ReadonlyArray<UpdateRecord_updateRecord_entries>;
}

export interface UpdateRecord {
  readonly updateRecord: UpdateRecord_updateRecord;
}

export interface UpdateRecordVariables {
  readonly input: UpdateRecordInput;
}
