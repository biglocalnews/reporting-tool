import React from "react";
import { useParams } from "react-router-dom";
import { DatasetsTable } from "./DatasetsTable";

interface RouteParams {
  datasetId: string
}

const ViewDatasetDetails = ({ datasetId }: RouteParams) => {
  const params = useParams<RouteParams>();
  return (
    <div>
      <h2>
        {"BBC News"} - {"Instagram"}
        {params.datasetId}
      </h2>
      <DatasetsTable data={[]} columns={[]} />
    </div>
  );
};

export { ViewDatasetDetails };
