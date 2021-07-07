/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AdminGetAllCategories
// ====================================================

export interface AdminGetAllCategories_categories {
  readonly __typename: "Category";
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface AdminGetAllCategories {
  readonly categories: ReadonlyArray<AdminGetAllCategories_categories>;
}
