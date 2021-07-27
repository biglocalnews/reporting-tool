/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CustomColumnType } from "./globalTypes";

// ====================================================
// GraphQL query operation: AdminGetAllCustomColumns
// ====================================================

export interface AdminGetAllCustomColumns_customColumns {
  readonly __typename: "CustomColumn";
  readonly id: string;
  readonly name: string;
  readonly type: CustomColumnType | null;
  readonly description: string | null;
}

export interface AdminGetAllCustomColumns {
  readonly customColumns: ReadonlyArray<AdminGetAllCustomColumns_customColumns>;
}
