import { PlusOutlined } from "@ant-design/icons";
import { useQuery } from "@apollo/client";
import { Button, DatePicker, Space } from "antd";
import moment, { Moment } from "moment";
import { RangeValue } from "rc-picker/lib/interface.d";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useParams } from "react-router-dom";
import DatasetDetailsFilterContext, {
  IDatasetDetailsFilter,
} from "../../components/DatasetDetailsFilterProvider";
import { Loading } from "../../components/Loading/Loading";
import { PageTitleBar } from "../../components/PageTitleBar";
import {
  GetDataset,
  GetDatasetVariables,
} from "../../graphql/__generated__/GetDataset";
import { GET_DATASET } from "../../graphql/__queries__/GetDataset.gql";
import { DatasetDetailsRecordsTable } from "./DatasetDetailsRecordsTable";
import { DatasetDetailsScoreCard } from "./DatasetDetailsScoreCard";
const { RangePicker } = DatePicker;

interface RouteParams {
  datasetId: string;
}

const DatasetDetails = (): JSX.Element => {
  const { datasetId } = useParams<RouteParams>();
  const history = useHistory();
  const { t } = useTranslation();
  const [selectedFilters, setSelectedFilters] =
    useState<IDatasetDetailsFilter>();

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

  function onChange(
    dates: RangeValue<Moment> | null,
    dateStrings: [string, string]
  ) {
    if (dates?.length && dates?.length === 2) {
      console.log("From: ", dates[0], ", to: ", dates[1]);
      console.log("From: ", dateStrings[0], ", to: ", dateStrings[1]);
      setSelectedFilters((curr) => ({ ...curr, DateRange: dates }));
    } else {
      setSelectedFilters((curr) => ({ ...curr, DateRange: null }));
    }
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

      <Space direction="vertical" size={12}>
        <RangePicker
          ranges={{
            Today: [moment(), moment()],
            "This Month": [moment().startOf("month"), moment().endOf("month")],
          }}
          onChange={onChange}
        />
      </Space>
      <DatasetDetailsFilterContext.Provider value={selectedFilters}>
        {queryData!.dataset.records.length > 0 && (
          <DatasetDetailsScoreCard data={queryData} datasetId={datasetId} />
        )}

        <DatasetDetailsRecordsTable
          datasetId={datasetId}
          datasetData={queryData}
          records={queryData?.dataset?.records}
          isLoading={queryLoading}
        />
      </DatasetDetailsFilterContext.Provider>
    </div>
  );
};

export { DatasetDetails };
