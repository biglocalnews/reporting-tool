/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetAllTags
// ====================================================

export interface GetAllTags_tags_datasets {
  readonly __typename: "Dataset";
  readonly id: string;
  readonly name: string;
  readonly lastUpdated: any | null;
}

export interface GetAllTags_tags_programs_targets_categoryValue_category {
  readonly __typename: "Category";
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface GetAllTags_tags_programs_targets_categoryValue {
  readonly __typename: "CategoryValue";
  readonly id: string;
  readonly name: string;
  readonly category: GetAllTags_tags_programs_targets_categoryValue_category;
}

export interface GetAllTags_tags_programs_targets {
  readonly __typename: "Target";
  readonly id: string;
  readonly target: number;
  readonly categoryValue: GetAllTags_tags_programs_targets_categoryValue;
}

export interface GetAllTags_tags_programs {
  readonly __typename: "Program";
  readonly name: string;
  readonly targets: ReadonlyArray<GetAllTags_tags_programs_targets>;
}

export interface GetAllTags_tags {
  readonly __typename: "Tag";
  readonly id: string;
  readonly name: string;
  readonly tagType: string;
  readonly description: string | null;
  readonly datasets: ReadonlyArray<GetAllTags_tags_datasets>;
  readonly programs: ReadonlyArray<GetAllTags_tags_programs>;
}

export interface GetAllTags {
  readonly tags: ReadonlyArray<GetAllTags_tags>;
}
