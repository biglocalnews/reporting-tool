/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetBasicStats
// ====================================================

export interface GetBasicStats_stats {
  readonly __typename: "Stats";
  readonly teams: number;
  readonly datasets: number;
  readonly tags: number;
}

export interface GetBasicStats {
  readonly stats: GetBasicStats_stats;
}
