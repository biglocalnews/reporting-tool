/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetAllCategories
// ====================================================

export interface GetAllCategories_categories_categoryValues {
  readonly __typename: "CategoryValue";
  readonly id: string;
  readonly name: string;
}

export interface GetAllCategories_categories {
  readonly __typename: "Category";
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly categoryValues: ReadonlyArray<GetAllCategories_categories_categoryValues>;
}

export interface GetAllCategories {
  readonly categories: ReadonlyArray<GetAllCategories_categories>;
}
