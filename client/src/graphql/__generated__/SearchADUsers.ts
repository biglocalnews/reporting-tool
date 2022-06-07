/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: SearchADUsers
// ====================================================

export interface SearchADUsers_adUsers {
  readonly __typename: "ADUser";
  readonly prefName: string | null;
  readonly firstName: string | null;
  readonly middleName: string | null;
  readonly surname: string | null;
  readonly username: string | null;
  readonly positionName: string | null;
  readonly workEmail: string | null;
  readonly idCardPhotoUrl: string | null;
}

export interface SearchADUsers {
  readonly adUsers: ReadonlyArray<SearchADUsers_adUsers>;
}

export interface SearchADUsersVariables {
  readonly search?: string | null;
}
