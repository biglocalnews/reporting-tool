/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

export enum ReportingPeriodType {
  annual = "annual",
  custom = "custom",
  monthly = "monthly",
  quarterly = "quarterly",
}

export interface BaseCategoryInput {
  readonly id: string;
}

export interface CategoryInput {
  readonly id?: string | null;
  readonly name: string;
  readonly description: string;
}

export interface CategoryValueInput {
  readonly id?: string | null;
  readonly name: string;
  readonly category: BaseCategoryInput;
}

export interface CreateProgramInput {
  readonly name: string;
  readonly description?: string | null;
  readonly teamId: string;
  readonly targets?: ReadonlyArray<TargetInput> | null;
  readonly tags?: ReadonlyArray<TagInput> | null;
  readonly datasets?: ReadonlyArray<UpsertDatasetInput> | null;
  readonly reportingPeriodType: ReportingPeriodType;
  readonly reportingPeriods?: ReadonlyArray<ReportingPeriodInput> | null;
}

export interface CreatePublishedRecordSetInput {
  readonly datasetId: string;
  readonly begin: any;
  readonly end: any;
  readonly record: ReadonlyArray<RecordSetEntryInput>;
  readonly targets: ReadonlyArray<(RecordSetTargetInput | null)>;
  readonly tags: ReadonlyArray<(string | null)>;
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
  readonly count?: number | null;
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

export interface ReportingPeriodInput {
  readonly id?: string | null;
  readonly programId: string;
  readonly range?: ReadonlyArray<any> | null;
  readonly begin?: any | null;
  readonly end?: any | null;
  readonly description?: string | null;
}

export interface TagInput {
  readonly id?: string | null;
  readonly name?: string | null;
  readonly description?: string | null;
  readonly tagType?: string | null;
}

export interface TargetInput {
  readonly id?: string | null;
  readonly target: number;
  readonly targetDate?: any | null;
  readonly category: CategoryInput;
  readonly tracks: ReadonlyArray<TrackInput>;
}

export interface TrackInput {
  readonly id?: string | null;
  readonly categoryValue: CategoryValueInput;
  readonly targetMember: boolean;
}

export interface UpdateProgramInput {
  readonly id: string;
  readonly name?: string | null;
  readonly teamId?: string | null;
  readonly description?: string | null;
  readonly targets?: ReadonlyArray<TargetInput> | null;
  readonly tags?: ReadonlyArray<TagInput> | null;
  readonly datasets?: ReadonlyArray<UpsertDatasetInput> | null;
  readonly reportingPeriodType: ReportingPeriodType;
  readonly reportingPeriods?: ReadonlyArray<ReportingPeriodInput> | null;
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
