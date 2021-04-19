/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteRecord
// ====================================================

export interface DeleteRecord_deleteRecord {
  readonly __typename: "DeleteDatasetRecordOutput";
  readonly id: string;
}

export interface DeleteRecord {
  readonly deleteRecord: DeleteRecord_deleteRecord;
}

export interface DeleteRecordVariables {
  readonly input: string;
}
