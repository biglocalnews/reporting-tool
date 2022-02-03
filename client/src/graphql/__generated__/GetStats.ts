/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetStats
// ====================================================

export interface GetStats_stats_consistencies {
  readonly __typename: "Consistency";
  readonly category: string;
  readonly year: number;
  readonly value: number;
  readonly consistencyState: string;
}

export interface GetStats_stats_overviews {
  readonly __typename: "Overview";
  readonly category: string;
  readonly date: string;
  readonly value: number;
  readonly targetState: string;
}

export interface GetStats_stats {
  readonly __typename: "Stats";
  readonly teams: number;
  readonly datasets: number;
  readonly tags: number;
  readonly gender: number;
  readonly ethnicity: number;
  readonly disability: number;
  readonly lgbtqa: number;
  readonly consistencies: ReadonlyArray<GetStats_stats_consistencies>;
  readonly overviews: ReadonlyArray<GetStats_stats_overviews>;
}

export interface GetStats {
  readonly stats: GetStats_stats;
}
