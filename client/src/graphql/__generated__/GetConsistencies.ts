/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetConsistencies
// ====================================================

export interface GetConsistencies_consistencies {
  readonly __typename: "Consistency";
  readonly category: string;
  readonly year: number;
  readonly value: number;
  readonly consistencyState: string;
}

export interface GetConsistencies {
  readonly consistencies: ReadonlyArray<GetConsistencies_consistencies>;
}
