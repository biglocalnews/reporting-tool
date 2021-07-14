import { Button, PageHeader, Typography } from "antd";
import { useHistory, useParams } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";
import { DatasetDetailsRecordsTable } from "./DatasetDetailsRecordsTable";
import {
  GetDataset,
  GetDatasetVariables,
} from "../../graphql/__generated__/GetDataset";
import { GET_DATASET } from "../../graphql/__queries__/GetDataset.gql";
import { useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { DatasetDetailsScoreCard } from "./DatasetDetailsScoreCard";

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
      <PageHeader
        style={{ padding: 0 }}
        title={
          <Text style={{ fontSize: "xx-large" }}>
            {queryData?.dataset?.program.name}
          </Text>
        }
        subTitle={
          <Text style={{ fontSize: "large" }}>{queryData?.dataset?.name}</Text>
        }
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
      ></PageHeader>

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
