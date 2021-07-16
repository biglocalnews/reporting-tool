/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetAllTags
// ====================================================

export interface GetAllTags_tags {
  readonly __typename: "Tag";
  readonly id: string;
  readonly name: string;
  readonly tagType: string;
  readonly description: string | null;
}

export interface GetAllTags {
  readonly tags: ReadonlyArray<GetAllTags_tags>;
}
