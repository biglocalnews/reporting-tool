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
  readonly description?: string | null;
  readonly teamId: string;
  readonly targets?: ReadonlyArray<TargetInput> | null;
  readonly tags?: ReadonlyArray<TagInput> | null;
  readonly datasets?: ReadonlyArray<UpsertDatasetInput> | null;
}

export interface CreatePublishedRecordSetInput {
  readonly datasetId: string;
  readonly month: number;
  readonly year: number;
  readonly record?: ReadonlyArray<(RecordSetEntryInput | null)> | null;
  readonly targets?: ReadonlyArray<(RecordSetTargetInput | null)> | null;
  readonly tags?: ReadonlyArray<(string | null)> | null;
}

export interface CreateRecordInput {
  readonly datasetId: string;
  readonly publicationDate: any;
  readonly entries?: ReadonlyArray<EntryInput> | null;
}

export interface CreateTeamInput {
  readonly name: string;
  readonly organizationId: string;
  readonly userIds?: ReadonlyArray<string> | null;
  readonly programIds?: ReadonlyArray<string> | null;
}

export interface EntryInput {
  readonly id?: string | null;
  readonly categoryValueId: string;
  readonly count: number;
  readonly personTypeId?: string | null;
}

export interface FirstTimeAppConfigurationInput {
  readonly organization: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
}

export interface RecordSetEntryInput {
  readonly percentOfCategory: number;
  readonly percentOfCategoryPersonType: number;
  readonly attribute: string;
  readonly attributeCategory: string;
  readonly personType: string;
}

export interface RecordSetTargetInput {
  readonly attributeCategory: string;
  readonly percent: number;
  readonly attributes: ReadonlyArray<string>;
}

export interface TagInput {
  readonly id?: string | null;
  readonly name?: string | null;
  readonly description?: string | null;
  readonly tagType?: string | null;
}

export interface TargetInput {
  readonly id?: string | null;
  readonly target?: number | null;
  readonly categoryValue?: CategoryValueInput | null;
}

export interface UpdateProgramInput {
  readonly id: string;
  readonly name?: string | null;
  readonly teamId?: string | null;
  readonly description?: string | null;
  readonly targets?: ReadonlyArray<TargetInput> | null;
  readonly tags?: ReadonlyArray<TagInput> | null;
  readonly datasets?: ReadonlyArray<UpsertDatasetInput> | null;
}

export interface UpdateRecordInput {
  readonly id: string;
  readonly datasetId?: string | null;
  readonly publicationDate?: any | null;
  readonly entries?: ReadonlyArray<EntryInput> | null;
}

export interface UpdateTeamInput {
  readonly id: string;
  readonly name?: string | null;
  readonly userIds?: ReadonlyArray<string> | null;
  readonly programIds?: ReadonlyArray<string> | null;
}

export interface UpsertDatasetInput {
  readonly id?: string | null;
  readonly name?: string | null;
  readonly description?: string | null;
  readonly personTypes?: ReadonlyArray<string> | null;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
