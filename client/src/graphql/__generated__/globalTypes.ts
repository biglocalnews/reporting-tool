/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

export interface CreateRecordInput {
  readonly datasetId: string;
  readonly publicationDate: any;
  readonly entries?: ReadonlyArray<EntryInput> | null;
}

export interface EntryInput {
  readonly id?: string | null;
  readonly categoryValueId: string;
  readonly count: number;
}

export interface UpdateRecordInput {
  readonly id: string;
  readonly datasetId?: string | null;
  readonly publicationDate?: any | null;
  readonly entries?: ReadonlyArray<EntryInput> | null;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
