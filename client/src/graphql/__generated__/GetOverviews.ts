/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetOverviews
// ====================================================

export interface GetOverviews_stats_overviews {
  readonly __typename: "Overview";
  readonly category: string;
  readonly date: string;
  readonly value: number;
  readonly targetState: string;
  readonly filter: string;
}

export interface GetOverviews_stats {
  readonly __typename: "Stats";
  readonly overviews: ReadonlyArray<GetOverviews_stats_overviews>;
}

export interface GetOverviews {
  readonly stats: GetOverviews_stats;
}
