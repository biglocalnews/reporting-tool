/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AdminGetUser
// ====================================================

export interface AdminGetUser_user_teams {
  readonly __typename: "Team";
  readonly id: string;
  readonly name: string;
}

export interface AdminGetUser_user_roles {
  readonly __typename: "Role";
  readonly id: string;
  readonly name: string;
}

export interface AdminGetUser_user {
  readonly __typename: "User";
  readonly email: string;
  readonly username: string | null;
  readonly firstName: string;
  readonly lastName: string;
  readonly active: boolean;
  readonly teams: ReadonlyArray<AdminGetUser_user_teams>;
  readonly roles: ReadonlyArray<AdminGetUser_user_roles>;
}

export interface AdminGetUser {
  readonly user: AdminGetUser_user;
}

export interface AdminGetUserVariables {
  readonly id: string;
}
