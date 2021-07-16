/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetUserList
// ====================================================

export interface GetUserList_users_roles {
  readonly __typename: "Role";
  readonly name: string;
}

export interface GetUserList_users_teams {
  readonly __typename: "Team";
  readonly id: string;
}

export interface GetUserList_users {
  readonly __typename: "User";
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly active: boolean;
  readonly roles: ReadonlyArray<GetUserList_users_roles>;
  readonly teams: ReadonlyArray<GetUserList_users_teams>;
}

export interface GetUserList {
  readonly users: ReadonlyArray<GetUserList_users>;
}
