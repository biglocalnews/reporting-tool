/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AdminStatsInput, TargetStateType, NeedsAttentionType } from "./globalTypes";

// ====================================================
// GraphQL query operation: GetAdminStats
// ====================================================

export interface GetAdminStats_adminStats_targetStates {
  readonly __typename: "TargetStates";
  readonly category: string;
  readonly reportingPeriodEnd: any;
  readonly prsId: string;
  readonly name: string;
  readonly state: TargetStateType;
  readonly percent: number;
  readonly target: number;
  readonly datasetId: string;
}

export interface GetAdminStats_adminStats_overdue {
  readonly __typename: "Overdue";
  readonly reportingPeriodEnd: any;
  readonly name: string;
  readonly datasetId: string;
  readonly reportingPeriodName: string | null;
}

export interface GetAdminStats_adminStats_needsAttention {
  readonly __typename: "NeedsAttention";
  readonly name: string;
  readonly datasetId: string;
  readonly reportingPeriodEnd: any;
  readonly count: number;
  readonly needsAttentionTypes: ReadonlyArray<NeedsAttentionType>;
}

export interface GetAdminStats_adminStats {
  readonly __typename: "AdminStats";
  readonly targetStates: ReadonlyArray<GetAdminStats_adminStats_targetStates>;
  readonly overdue: ReadonlyArray<GetAdminStats_adminStats_overdue>;
  readonly needsAttention: ReadonlyArray<GetAdminStats_adminStats_needsAttention>;
}

export interface GetAdminStats {
  readonly adminStats: GetAdminStats_adminStats;
}

export interface GetAdminStatsVariables {
  readonly input?: AdminStatsInput | null;
}
