/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

export interface BaseCategoryInput {
  readonly id: string;
}

export interface CategoryValueInput {
  readonly id?: string | null;
  readonly name?: string | null;
  readonly category: BaseCategoryInput;
}

export interface CreateProgramInput {
  readonly name: string;
  readonly teamId: string;
  readonly targets?: ReadonlyArray<TargetInput> | null;
}

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

export interface TargetInput {
  readonly id?: string | null;
  readonly target: number;
  readonly categoryValue: CategoryValueInput;
}

export interface UpdateProgramInput {
  readonly id: string;
  readonly name?: string | null;
  readonly teamId?: string | null;
  readonly description?: string | null;
  readonly targets?: ReadonlyArray<TargetInput> | null;
  readonly datasets?: ReadonlyArray<UpsertDatasetInput> | null;
}

export interface UpdateRecordInput {
  readonly id: string;
  readonly datasetId?: string | null;
  readonly publicationDate?: any | null;
  readonly entries?: ReadonlyArray<EntryInput> | null;
}

export interface UpsertDatasetInput {
  readonly id?: string | null;
  readonly name?: string | null;
  readonly description?: string | null;
}

//==============================================================
// END Enums and Input Objects
//==============================================================