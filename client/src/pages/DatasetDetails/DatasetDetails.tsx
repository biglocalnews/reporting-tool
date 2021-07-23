import { PlusOutlined } from "@ant-design/icons";
import { useQuery } from "@apollo/client";
import { Button } from "antd";
import { useTranslation } from "react-i18next";
import { useHistory, useParams } from "react-router-dom";
import { Loading } from "../../components/Loading/Loading";
import { PageTitleBar } from "../../components/PageTitleBar";
import {
  GetDataset,
  GetDatasetVariables,
} from "../../graphql/__generated__/GetDataset";
import { GET_DATASET } from "../../graphql/__queries__/GetDataset.gql";
import { DatasetDetailsRecordsTable } from "./DatasetDetailsRecordsTable";
import { DatasetDetailsScoreCard } from "./DatasetDetailsScoreCard";

interface RouteParams {
  datasetId: string;
}

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

  if (queryLoading) {
    return <Loading />;
  }

  if (queryError) {
    throw queryError;
  }

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
