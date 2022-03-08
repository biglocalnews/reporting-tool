import { gql } from "@apollo/client";

export const SEARCH_AD_USERS = gql`
  query SearchADUsers($search: String) {
    adUsers(search: $search) {
        prefName
        firstName
        middleName
        surname
        username
        positionName
        workEmail
        idCardPhotoUrl
    }
  }`;