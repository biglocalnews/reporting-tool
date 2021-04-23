/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetUser
// ====================================================

export interface GetUser_user_teams_programs_datasets_records {
  readonly __typename: "Record";
  readonly id: string;
  readonly publicationDate: any | null;
}

export interface GetUser_user_teams_programs_datasets_tags {
  readonly __typename: "Tag";
  readonly name: string;
}

export interface GetUser_user_teams_programs_datasets {
  readonly __typename: "Dataset";
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly records: ReadonlyArray<GetUser_user_teams_programs_datasets_records>;
  readonly tags: ReadonlyArray<GetUser_user_teams_programs_datasets_tags>;
}

export interface GetUser_user_teams_programs {
  readonly __typename: "Program";
  readonly id: string;
  readonly name: string;
  readonly datasets: ReadonlyArray<GetUser_user_teams_programs_datasets>;
}

export interface GetUser_user_teams {
  readonly __typename: "Team";
  readonly programs: ReadonlyArray<GetUser_user_teams_programs>;
}

export interface GetUser_user {
  readonly __typename: "User";
  readonly firstName: string;
  readonly lastName: string;
  readonly teams: ReadonlyArray<GetUser_user_teams>;
}

export interface GetUser {
  readonly user: GetUser_user | null;
}

export interface GetUserVariables {
  readonly id: string;
}
