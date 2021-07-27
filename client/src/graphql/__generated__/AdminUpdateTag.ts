/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { UpdateTagInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AdminUpdateTag
// ====================================================

export interface AdminUpdateTag_updateTag {
  readonly __typename: "Tag";
  readonly id: string;
  readonly tagType: string;
  readonly name: string;
  readonly description: string | null;
}

export interface AdminUpdateTag {
  readonly updateTag: AdminUpdateTag_updateTag;
}

export interface AdminUpdateTagVariables {
  readonly input: UpdateTagInput;
}
