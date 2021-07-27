/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetBasicStats
// ====================================================

export interface GetBasicStats_basicStats {
  readonly __typename: "BasicStats";
  readonly teams: number;
  readonly datasets: number;
  readonly tags: number;
}

export interface GetBasicStats {
  readonly basicStats: GetBasicStats_basicStats;
}
