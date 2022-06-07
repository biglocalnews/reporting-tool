/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AdminGetAllPersonTypes
// ====================================================

export interface AdminGetAllPersonTypes_personTypes {
  readonly __typename: "PersonType";
  readonly id: string;
  readonly personTypeName: string;
}

export interface AdminGetAllPersonTypes {
  readonly personTypes: ReadonlyArray<AdminGetAllPersonTypes_personTypes>;
}
