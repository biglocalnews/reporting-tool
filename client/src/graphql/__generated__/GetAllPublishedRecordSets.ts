/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetAllPublishedRecordSets
// ====================================================

export interface GetAllPublishedRecordSets_publishedRecordSets {
  readonly __typename: "PublishedRecordSet";
  readonly id: string;
  readonly begin: any;
  readonly end: any;
  readonly document: any | null;
  readonly datasetId: string;
}

export interface GetAllPublishedRecordSets {
  readonly publishedRecordSets: ReadonlyArray<GetAllPublishedRecordSets_publishedRecordSets>;
}
