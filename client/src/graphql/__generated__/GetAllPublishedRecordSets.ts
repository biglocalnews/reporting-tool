/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PublishedRecordSetsInput } from "./globalTypes";

// ====================================================
// GraphQL query operation: GetAllPublishedRecordSets
// ====================================================

export interface GetAllPublishedRecordSets_publishedRecordSets_dataset_program_tags {
  readonly __typename: "Tag";
  readonly name: string;
}

export interface GetAllPublishedRecordSets_publishedRecordSets_dataset_program_targets_category {
  readonly __typename: "Category";
  readonly name: string;
}

export interface GetAllPublishedRecordSets_publishedRecordSets_dataset_program_targets {
  readonly __typename: "Target";
  readonly category: GetAllPublishedRecordSets_publishedRecordSets_dataset_program_targets_category;
  readonly target: number;
}

export interface GetAllPublishedRecordSets_publishedRecordSets_dataset_program {
  readonly __typename: "Program";
  readonly importedId: number | null;
  readonly tags: ReadonlyArray<GetAllPublishedRecordSets_publishedRecordSets_dataset_program_tags>;
  readonly targets: ReadonlyArray<GetAllPublishedRecordSets_publishedRecordSets_dataset_program_targets>;
}

export interface GetAllPublishedRecordSets_publishedRecordSets_dataset {
  readonly __typename: "Dataset";
  readonly program: GetAllPublishedRecordSets_publishedRecordSets_dataset_program | null;
}

export interface GetAllPublishedRecordSets_publishedRecordSets {
  readonly __typename: "PublishedRecordSet";
  readonly id: string;
  readonly begin: any;
  readonly end: any;
  readonly document: any | null;
  readonly datasetId: string;
  readonly dataset: GetAllPublishedRecordSets_publishedRecordSets_dataset | null;
}

export interface GetAllPublishedRecordSets {
  readonly publishedRecordSets: ReadonlyArray<GetAllPublishedRecordSets_publishedRecordSets>;
}

export interface GetAllPublishedRecordSetsVariables {
  readonly input: PublishedRecordSetsInput;
}
