/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetConsistencies
// ====================================================

export interface GetConsistencies_stats_consistencies {
  readonly __typename: "Consistency";
  readonly category: string;
  readonly year: number;
  readonly value: number;
  readonly consistencyState: string;
}

export interface GetConsistencies_stats {
  readonly __typename: "Stats";
  readonly consistencies: ReadonlyArray<GetConsistencies_stats_consistencies>;
}

export interface GetConsistencies {
  readonly stats: GetConsistencies_stats;
}
