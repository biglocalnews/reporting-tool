/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

export interface CreateRecordInput {
  readonly id?: string | null;
  readonly datasetId: string;
  readonly publicationDate: any;
  readonly entries: ReadonlyArray<EntryInput>;
}

export interface EntryInput {
  readonly id?: string | null;
  readonly category: string;
  readonly categoryValue: string;
  readonly count: number;
}

export interface UpdateEntryInput {
  readonly id: string;
  readonly category: string;
  readonly categoryValue: string;
  readonly count: number;
}

export interface UpdateRecordInput {
  readonly id: string;
  readonly datasetId: string;
  readonly publicationDate: any;
  readonly entries: ReadonlyArray<UpdateEntryInput>;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
