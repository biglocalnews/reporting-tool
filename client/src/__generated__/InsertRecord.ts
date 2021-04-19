/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { InsertDatasetRecordInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: InsertRecord
// ====================================================

export interface InsertRecord_insertRecord_record {
  readonly __typename: "Record";
  readonly id: string;
}

export interface InsertRecord_insertRecord {
  readonly __typename: "InsertDatasetRecordOutput";
  readonly record: InsertRecord_insertRecord_record;
}

export interface InsertRecord {
  readonly insertRecord: InsertRecord_insertRecord;
}

export interface InsertRecordVariables {
  readonly input: InsertDatasetRecordInput;
}
