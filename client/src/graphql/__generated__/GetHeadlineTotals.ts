/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetHeadlineTotals
// ====================================================

export interface GetHeadlineTotals_headlineTotals_gender {
  readonly __typename: "HeadlineTotal";
  readonly percent: number;
  readonly noOfDatasets: number;
}

export interface GetHeadlineTotals_headlineTotals_ethnicity {
  readonly __typename: "HeadlineTotal";
  readonly percent: number;
  readonly noOfDatasets: number;
}

export interface GetHeadlineTotals_headlineTotals_disability {
  readonly __typename: "HeadlineTotal";
  readonly percent: number;
  readonly noOfDatasets: number;
}

export interface GetHeadlineTotals_headlineTotals_lgbtqa {
  readonly __typename: "HeadlineTotal";
  readonly percent: number;
  readonly noOfDatasets: number;
}

export interface GetHeadlineTotals_headlineTotals {
  readonly __typename: "HeadlineTotals";
  readonly gender: GetHeadlineTotals_headlineTotals_gender | null;
  readonly ethnicity: GetHeadlineTotals_headlineTotals_ethnicity | null;
  readonly disability: GetHeadlineTotals_headlineTotals_disability | null;
  readonly lgbtqa: GetHeadlineTotals_headlineTotals_lgbtqa | null;
}

export interface GetHeadlineTotals {
  readonly headlineTotals: GetHeadlineTotals_headlineTotals;
}
