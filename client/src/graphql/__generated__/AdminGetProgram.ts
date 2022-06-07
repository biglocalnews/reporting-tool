/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CustomColumnType, ReportingPeriodType } from "./globalTypes";

// ====================================================
// GraphQL query operation: AdminGetProgram
// ====================================================

export interface AdminGetProgram_program_team {
  readonly __typename: "Team";
  readonly id: string;
  readonly name: string;
}

export interface AdminGetProgram_program_tags {
  readonly __typename: "Tag";
  readonly id: string;
  readonly name: string;
  readonly tagType: string;
  readonly description: string | null;
}

export interface AdminGetProgram_program_datasets_personTypes {
  readonly __typename: "PersonType";
  readonly id: string;
  readonly personTypeName: string;
}

export interface AdminGetProgram_program_datasets_customColumns {
  readonly __typename: "CustomColumn";
  readonly id: string;
  readonly name: string;
  readonly type: CustomColumnType | null;
  readonly description: string | null;
}

export interface AdminGetProgram_program_datasets {
  readonly __typename: "Dataset";
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly personTypes: ReadonlyArray<AdminGetProgram_program_datasets_personTypes>;
  readonly customColumns: ReadonlyArray<AdminGetProgram_program_datasets_customColumns> | null;
}

export interface AdminGetProgram_program_reportingPeriods {
  readonly __typename: "ReportingPeriod";
  readonly id: string;
  readonly begin: any | null;
  readonly end: any | null;
  readonly range: ReadonlyArray<any>;
  readonly description: string | null;
}

export interface AdminGetProgram_program_targets_category {
  readonly __typename: "Category";
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface AdminGetProgram_program_targets_tracks_categoryValue_category {
  readonly __typename: "Category";
  readonly id: string;
}

export interface AdminGetProgram_program_targets_tracks_categoryValue {
  readonly __typename: "CategoryValue";
  readonly id: string;
  readonly name: string;
  readonly category: AdminGetProgram_program_targets_tracks_categoryValue_category;
}

export interface AdminGetProgram_program_targets_tracks {
  readonly __typename: "Track";
  readonly id: string;
  readonly targetMember: boolean;
  readonly categoryValue: AdminGetProgram_program_targets_tracks_categoryValue;
}

export interface AdminGetProgram_program_targets {
  readonly __typename: "Target";
  readonly id: string;
  readonly category: AdminGetProgram_program_targets_category;
  readonly target: number;
  readonly tracks: ReadonlyArray<AdminGetProgram_program_targets_tracks>;
}

export interface AdminGetProgram_program {
  readonly __typename: "Program";
  readonly name: string;
  readonly description: string;
  readonly team: AdminGetProgram_program_team | null;
  readonly deleted: any | null;
  readonly tags: ReadonlyArray<AdminGetProgram_program_tags>;
  readonly datasets: ReadonlyArray<AdminGetProgram_program_datasets>;
  readonly reportingPeriodType: ReportingPeriodType;
  readonly reportingPeriods: ReadonlyArray<AdminGetProgram_program_reportingPeriods> | null;
  readonly targets: ReadonlyArray<AdminGetProgram_program_targets>;
}

export interface AdminGetProgram {
  readonly program: AdminGetProgram_program;
}

export interface AdminGetProgramVariables {
  readonly id: string;
}
