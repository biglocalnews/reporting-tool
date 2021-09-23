import { PlusOutlined } from "@ant-design/icons";
import DislikeTwoTone from "@ant-design/icons/lib/icons/DislikeTwoTone";
import LikeTwoTone from "@ant-design/icons/lib/icons/LikeTwoTone";
import { useQuery } from "@apollo/client";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Row,
  Space,
  Statistic,
  Typography,
} from "antd";
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
const { Text } = Typography;
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
  const defaultPresetDate = "This Month";
  const [selectedFilters, setSelectedFilters] = useState<IDatasetDetailsFilter>(
    { DateRange: PresetDateRanges[defaultPresetDate] }
  );
  const [presetDate, setPresetDate] = useState<string | null>(
    defaultPresetDate
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
          const presetDate = Object.entries(PresetDateRanges).find(
            ([, v]) => v === selectedFilters.DateRange
          )?.[0];
          if (presetDate) {
            setPresetDate(presetDate);
          } else {
            setPresetDate(null);
          }
          return queryData?.dataset?.records.filter(
            (record: GetDataset_dataset_records) =>
              moment(record.publicationDate) >= from &&
              moment(record.publicationDate) <= to
          );
        }
      }
    }
    setPresetDate("All Time");
    return queryData?.dataset?.records;
  }, [queryData?.dataset?.records, selectedFilters]);

  const targetStates = useMemo(() => {
    return queryData?.dataset?.program.targets.map((target) => ({
      name: target.categoryValue.name,
      target: target.target,
      status: filteredRecords
        ? Math.round(
            (filteredRecords.reduce((prev, curr) => {
              return (
                prev +
                curr.entries.reduce((prevEntry, currEntry) => {
                  return currEntry.categoryValue.name ===
                    target.categoryValue.name
                    ? currEntry.count + prevEntry
                    : prevEntry;
                }, 0)
              );
            }, 0) /
              filteredRecords.reduce((prev, curr) => {
                return (
                  prev +
                  curr.entries.reduce((prevEntry, currEntry) => {
                    return currEntry.categoryValue.category.name ===
                      target.categoryValue.category.name
                      ? currEntry.count + prevEntry
                      : prevEntry;
                  }, 0)
                );
              }, 0)) *
              100
          )
        : 0,
    }));
  }, [queryData?.dataset?.program.targets, filteredRecords]);

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

      <Space
        align="center"
        direction="vertical"
        size="middle"
        style={{ width: "100%" }}
      >
        {presetDate ? <Text strong>{t(presetDate)}</Text> : null}
        <RangePicker
          value={
            selectedFilters?.DateRange?.length == 2
              ? [selectedFilters?.DateRange[0], selectedFilters.DateRange[1]]
              : [null, null]
          }
          ranges={PresetDateRanges}
          onChange={onChangeDateRange}
        />

        {filteredRecords?.length ? (
          <DatasetDetailsFilterContext.Provider value={selectedFilters}>
            <Row>
              {targetStates?.map((target) => (
                <Col
                  key={target.name}
                  span={
                    targetStates?.length
                      ? Math.round(24 / targetStates?.length)
                      : 5
                  }
                >
                  <Card>
                    <Statistic
                      title={`Percentage of ${target.name}`}
                      value={target.status}
                      suffix="%"
                      prefix={
                        target.status / 100 >= target.target ? (
                          <LikeTwoTone twoToneColor="green" />
                        ) : (
                          <DislikeTwoTone twoToneColor="red" />
                        )
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>

            <DatasetDetailsScoreCard
              data={queryData}
              datasetId={datasetId}
              filteredRecords={filteredRecords}
            />

            <DatasetDetailsRecordsTable
              datasetId={datasetId}
              datasetData={queryData}
              records={filteredRecords}
              isLoading={queryLoading}
            />
          </DatasetDetailsFilterContext.Provider>
        ) : (
          <div
            style={{
              marginTop: "auto",
              marginBottom: "auto",
              textAlign: "center",
            }}
          >
            <Text strong>
              {t("noDataAvailable")}
              {presetDate && (
                <span style={{ textTransform: "lowercase" }}>
                  {" " + t(presetDate)}
                </span>
              )}
            </Text>
          </div>
        )}
      </Space>
    </div>
  );
};

export { DatasetDetails };
