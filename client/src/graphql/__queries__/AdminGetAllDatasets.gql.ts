import { gql } from "@apollo/client";

export const ADMIN_GET_ALL_DATASETS = gql`
  query AdminGetAllDatasets($onlyUnassigned: Boolean) {
    datasets(onlyUnassigned: $onlyUnassigned){        
          id
          name
          description
          lastUpdated
          program {
            id
          }
          tags {
            name
            tagType
          }
        }    
  }  
`;
