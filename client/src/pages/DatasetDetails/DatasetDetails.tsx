import { PlusOutlined } from "@ant-design/icons";
import { useQuery } from "@apollo/client";
import { Button, Typography } from "antd";
import { useTranslation } from "react-i18next";
import React from "react";
import { useHistory, useParams } from "react-router-dom";
import {
  GetDataset,
  GetDatasetVariables,
} from "../../graphql/__generated__/GetDataset";
import { GET_DATASET } from "../../graphql/__queries__/GetDataset.gql";
import { DatasetDetailsRecordsTable } from "./DatasetDetailsRecordsTable";
import { DatasetDetailsScoreCard } from "./DatasetDetailsScoreCard";
import { PageTitleBar } from "../../components/PageTitleBar/PageTitleBar";

interface RouteParams {
  datasetId: string;
}

const { Text } = Typography;

const DatasetDetails = (): JSX.Element => {
  const { datasetId } = useParams<RouteParams>();
  const history = useHistory();
  const { t } = useTranslation();

  const {
    data: queryData,
    loading: queryLoading,
    error: queryError,
  } = useQuery<GetDataset, GetDatasetVariables>(GET_DATASET, {
    variables: { id: datasetId },
  });

  // TODO: update for error and loading components
  if (queryLoading) return <h1>Loading</h1>;
  if (queryError) return <div>{`Error: ${queryError.message}`}</div>;

  return (
    <div className="dataset-details_container">
      <PageTitleBar
        title={queryData?.dataset?.program.name}
        subtitle={queryData?.dataset?.name}
        extra={[
          <Button
            key="1"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => history.push(`/dataset/${datasetId}/entry`)}
          >
            {t("addData")}
          </Button>,
        ]}
      />

      {queryData!.dataset.records.length > 0 && (
        <DatasetDetailsScoreCard data={queryData} datasetId={datasetId} />
      )}

      <DatasetDetailsRecordsTable
        datasetId={datasetId}
        datasetData={queryData}
        records={queryData?.dataset?.records}
        isLoading={queryLoading}
      />
    </div>
  );
};

export { DatasetDetails };
