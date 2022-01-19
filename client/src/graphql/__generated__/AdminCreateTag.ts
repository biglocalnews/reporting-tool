/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CreateTagInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AdminCreateTag
// ====================================================

export interface AdminCreateTag_createTag {
  readonly __typename: "Tag";
  readonly tagType: string;
  readonly name: string;
  readonly description: string | null;
}

export interface AdminCreateTag {
  readonly createTag: AdminCreateTag_createTag;
}

export interface AdminCreateTagVariables {
  readonly input: CreateTagInput;
}
