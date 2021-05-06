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

export interface UpdateRecord_updateRecord_entries {
  readonly __typename: "Entry";
  readonly id: string;
  readonly category: string;
  readonly categoryValue: string;
  readonly count: number;
}

export interface UpdateRecord_updateRecord {
  readonly __typename: "Record";
  readonly id: string;
  readonly publicationDate: any;
  readonly dataset: UpdateRecord_updateRecord_dataset;
  readonly entries: ReadonlyArray<UpdateRecord_updateRecord_entries>;
}

export interface UpdateRecord {
  readonly updateRecord: UpdateRecord_updateRecord;
}

export interface UpdateRecordVariables {
  readonly input: UpdateRecordInput;
}
