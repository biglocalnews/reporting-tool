import { useQuery } from "@apollo/client";
import { GetDataset, GetDatasetVariables } from "../__generated__/GetDataset";
import { GET_DATASET } from "../__queries__/GetDataset.gql";

interface QueryProps {
  datasetId: string;
}

const useDatasetQuery = ({ datasetId }: QueryProps) => {
  const {
    data: datasetQueryData,
    loading: loadingDatasetQueryData,
    error: errorOnQueryDataset,
  } = useQuery<GetDataset, GetDatasetVariables>(GET_DATASET, {
    variables: { id: datasetId },
  });

  return { datasetQueryData, loadingDatasetQueryData, errorOnQueryDataset };
};

export { useDatasetQuery };
