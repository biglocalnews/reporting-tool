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
  GetDataset_dataset_records,
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

  const filteredRecords = (
    data: readonly GetDataset_dataset_records[] | undefined
  ) => {
    if (selectedFilters && data) {
      if (selectedFilters.DateRange && selectedFilters.DateRange.length === 2) {
        const from = selectedFilters.DateRange[0];
        const to = selectedFilters.DateRange[1];
        if (from && to) {
          return data.filter(
            (record: GetDataset_dataset_records) =>
              moment(record.publicationDate) >= from &&
              moment(record.publicationDate) <= to
          );
        }
      }
    }
    return data;
  };

  if (queryLoading) {
    return <Loading />;
  }

  if (queryError) {
    throw queryError;
  }

  function onChangeDateRange(
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
            "This Month": [moment().startOf("month"), moment().endOf("month")],
            "Last Month": [
              moment().subtract(1, "months").startOf("month"),
              moment().subtract(1, "months").endOf("month"),
            ],
            "This Year": [moment().startOf("year"), moment().endOf("year")],
          }}
          onChange={onChangeDateRange}
        />
      </Space>
      <DatasetDetailsFilterContext.Provider value={selectedFilters}>
        {queryData!.dataset.records.length > 0 && (
          <DatasetDetailsScoreCard
            data={queryData}
            datasetId={datasetId}
            filteredRecords={filteredRecords(queryData?.dataset?.records)}
          />
        )}

        <DatasetDetailsRecordsTable
          datasetId={datasetId}
          datasetData={queryData}
          records={filteredRecords(queryData?.dataset?.records)}
          isLoading={queryLoading}
        />
      </DatasetDetailsFilterContext.Provider>
    </div>
  );
};

export { DatasetDetails };
