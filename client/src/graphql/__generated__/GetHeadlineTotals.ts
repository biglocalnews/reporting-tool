/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetHeadlineTotals
// ====================================================

export interface GetHeadlineTotals_stats {
  readonly __typename: "Stats";
  readonly gender: number;
  readonly ethnicity: number;
  readonly disability: number;
  readonly lgbtqa: number;
}

export interface GetHeadlineTotals {
  readonly stats: GetHeadlineTotals_stats;
}
