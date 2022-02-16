/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AdminStatsInput, TargetStateType } from "./globalTypes";

// ====================================================
// GraphQL query operation: GetAdminStats
// ====================================================

export interface GetAdminStats_adminStats_targetStates {
  readonly __typename: "DatasetDetails";
  readonly category: string;
  readonly date: string;
  readonly id: string;
  readonly name: string;
  readonly state: TargetStateType;
  readonly percent: number;
  readonly target: number;
  readonly dataset_id: string;
}

export interface GetAdminStats_adminStats {
  readonly __typename: "AdminStats";
  readonly targetStates: ReadonlyArray<GetAdminStats_adminStats_targetStates>;
}

export interface GetAdminStats {
  readonly adminStats: GetAdminStats_adminStats;
}

export interface GetAdminStatsVariables {
  readonly input?: AdminStatsInput | null;
}
