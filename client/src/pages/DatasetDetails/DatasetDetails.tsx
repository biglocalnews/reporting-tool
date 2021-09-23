import { PlusOutlined } from "@ant-design/icons";
import { useQuery } from "@apollo/client";
import { Button, DatePicker, Space } from "antd";
import moment, { Moment } from "moment";
import { EventValue, RangeValue } from "rc-picker/lib/interface.d";
import { useMemo, useState } from "react";
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

const PresetDateRanges: Record<
  string,
  [EventValue<Moment>, EventValue<Moment>]
> = {
  "This Month": [moment().startOf("month"), moment().endOf("month")],
  "Last Month": [
    moment().subtract(1, "months").startOf("month"),
    moment().subtract(1, "months").endOf("month"),
  ],
  "This Year": [moment().startOf("year"), moment().endOf("year")],
};

const DatasetDetails = (): JSX.Element => {
  const { datasetId } = useParams<RouteParams>();
  const history = useHistory();
  const { t } = useTranslation();
  const [selectedFilters, setSelectedFilters] = useState<IDatasetDetailsFilter>(
    { DateRange: [moment().startOf("month"), moment().endOf("month")] }
  );

  const {
    data: queryData,
    loading: queryLoading,
    error: queryError,
  } = useQuery<GetDataset, GetDatasetVariables>(GET_DATASET, {
    variables: { id: datasetId },
  });

  const filteredRecords = useMemo(() => {
    if (selectedFilters && queryData?.dataset?.records) {
      if (selectedFilters.DateRange && selectedFilters.DateRange.length === 2) {
        const from = selectedFilters.DateRange[0];
        const to = selectedFilters.DateRange[1];
        if (from && to) {
          return queryData?.dataset?.records.filter(
            (record: GetDataset_dataset_records) =>
              moment(record.publicationDate) >= from &&
              moment(record.publicationDate) <= to
          );
        }
      }
    }
    return queryData?.dataset?.records;
  }, [queryData?.dataset?.records, selectedFilters]);

  if (queryLoading) {
    return <Loading />;
  }

  if (queryError) {
    throw queryError;
  }

  function onChangeDateRange(dates: RangeValue<Moment> | null) {
    if (dates?.length && dates?.length === 2) {
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
          value={
            selectedFilters?.DateRange?.length == 2
              ? [selectedFilters?.DateRange[0], selectedFilters.DateRange[1]]
              : null
          }
          ranges={PresetDateRanges}
          onChange={onChangeDateRange}
        />
      </Space>
      <DatasetDetailsFilterContext.Provider value={selectedFilters}>
        {queryData!.dataset.records.length > 0 && (
          <DatasetDetailsScoreCard
            data={queryData}
            datasetId={datasetId}
            filteredRecords={filteredRecords}
          />
        )}

        <DatasetDetailsRecordsTable
          datasetId={datasetId}
          datasetData={queryData}
          records={filteredRecords}
          isLoading={queryLoading}
        />
      </DatasetDetailsFilterContext.Provider>
    </div>
  );
};

export { DatasetDetails };
