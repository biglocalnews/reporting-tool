/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

export interface UpsertDataInput {
  readonly id?: string | null;
  readonly category: string;
  readonly categoryValue: string;
  readonly count: number;
}

export interface UpsertDatasetRecordInput {
  readonly id?: string | null;
  readonly datasetId: string;
  readonly publicationDate?: any | null;
  readonly data: ReadonlyArray<UpsertDataInput>;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
