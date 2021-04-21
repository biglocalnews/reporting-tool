/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { UpsertDatasetRecordInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpsertRecord
// ====================================================

export interface UpsertRecord_upsertRecord_record {
  readonly __typename: "Record";
  readonly id: string;
}

export interface UpsertRecord_upsertRecord {
  readonly __typename: "UpsertDatasetRecordOutput";
  readonly record: UpsertRecord_upsertRecord_record;
}

export interface UpsertRecord {
  readonly upsertRecord: UpsertRecord_upsertRecord;
}

export interface UpsertRecordVariables {
  readonly input: UpsertDatasetRecordInput;
}
