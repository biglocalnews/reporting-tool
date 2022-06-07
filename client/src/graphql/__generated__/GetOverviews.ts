/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetOverviews
// ====================================================

export interface GetOverviews_overviews {
  readonly __typename: "Overview";
  readonly category: string;
  readonly date: string;
  readonly value: number;
  readonly targetState: string;
  readonly filter: string;
}

export interface GetOverviews {
  readonly overviews: ReadonlyArray<GetOverviews_overviews>;
}
