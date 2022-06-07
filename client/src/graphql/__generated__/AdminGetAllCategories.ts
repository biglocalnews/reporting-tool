/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AdminGetAllCategories
// ====================================================

export interface AdminGetAllCategories_categories_categoryValues {
  readonly __typename: "CategoryValue";
  readonly name: string;
}

export interface AdminGetAllCategories_categories {
  readonly __typename: "Category";
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly categoryValues: ReadonlyArray<AdminGetAllCategories_categories_categoryValues>;
}

export interface AdminGetAllCategories {
  readonly categories: ReadonlyArray<AdminGetAllCategories_categories>;
}
