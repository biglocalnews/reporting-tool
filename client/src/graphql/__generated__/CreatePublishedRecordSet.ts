/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CreatePublishedRecordSetInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: CreatePublishedRecordSet
// ====================================================

export interface CreatePublishedRecordSet_createPublishedRecordSet {
  readonly __typename: "PublishedRecordSet";
  readonly begin: any;
  readonly end: any;
  readonly datasetId: string;
}

export interface CreatePublishedRecordSet {
  readonly createPublishedRecordSet: CreatePublishedRecordSet_createPublishedRecordSet;
}

export interface CreatePublishedRecordSetVariables {
  readonly input: CreatePublishedRecordSetInput;
}
