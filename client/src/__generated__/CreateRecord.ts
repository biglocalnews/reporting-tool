/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CreateRecordInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: CreateRecord
// ====================================================

export interface CreateRecord_createRecord_dataset {
  readonly __typename: "Dataset";
  readonly name: string;
}

export interface CreateRecord_createRecord {
  readonly __typename: "Record";
  readonly id: string;
  readonly publicationDate: any;
  readonly dataset: CreateRecord_createRecord_dataset;
}

export interface CreateRecord {
  readonly createRecord: CreateRecord_createRecord;
}

export interface CreateRecordVariables {
  readonly input: CreateRecordInput;
}
