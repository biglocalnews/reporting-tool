import { Column, ColumnConfig, Gauge } from "@ant-design/charts";
import { PlusOutlined } from "@ant-design/icons";
import DownCircleTwoTone from "@ant-design/icons/lib/icons/DownCircleTwoTone";
import UpCircleTwoTone from "@ant-design/icons/lib/icons/UpCircleTwoTone";
import { useQuery } from "@apollo/client";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Row,
  Space,
  Statistic,
  Tabs,
  Typography,
} from "antd";
import moment, { Moment } from "moment";
import { EventValue, RangeValue } from "rc-picker/lib/interface.d";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useParams } from "react-router-dom";
import { IDatasetDetailsFilter } from "../../components/DatasetDetailsFilterProvider";
import { Loading } from "../../components/Loading/Loading";
import { PageTitleBar } from "../../components/PageTitleBar";
import {
  GetDataset,
  GetDatasetVariables,
  GetDataset_dataset_program_targets_categoryValue,
  GetDataset_dataset_records,
  GetDataset_dataset_records_entries,
} from "../../graphql/__generated__/GetDataset";
import { GET_DATASET } from "../../graphql/__queries__/GetDataset.gql";
import { DatasetDetailsRecordsTable } from "./DatasetDetailsRecordsTable";
import { DatasetDetailsScoreCard } from "./DatasetDetailsScoreCard";
const { TabPane } = Tabs;
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

  const sortedRecords = useMemo(() => {
    if (queryData?.dataset?.records) {
      return Array.from(queryData.dataset.records).sort(
        (a, b) => Date.parse(a.publicationDate) - Date.parse(b.publicationDate)
      );
    }
  }, [queryData]);

  /*const firstRecord = useMemo(() => {
    if (sortedRecords && sortedRecords?.length) {
      return sortedRecords[0];
    }
  }, [sortedRecords]);*/

  interface IEntry {
    MonthYear: string;
    Attribute: string;
    AttributeCategory: string;
    AttributeCount: number;
    AttributeCategoryCount: number;
    Percent: number | undefined;
    Target: number | undefined;
  }

  const sumOfEntriesByAttributeCategory = (
    entries: readonly GetDataset_dataset_records_entries[],
    attributeCategory: string
  ) => {
    return entries.reduce((prevEntry, currEntry) => {
      return currEntry.categoryValue.category.name === attributeCategory
        ? currEntry.count + prevEntry
        : prevEntry;
    }, 0);
  };

  const sumOfRecordsByAttributeCategory = (
    records: readonly GetDataset_dataset_records[],
    attributeCategory: string
  ) => {
    return records.reduce((prev, curr) => {
      return (
        prev + sumOfEntriesByAttributeCategory(curr.entries, attributeCategory)
      );
    }, 0);
  };

  const sumOfEntriesByAttribute = (
    entries: readonly GetDataset_dataset_records_entries[],
    attribute: string
  ) => {
    return entries.reduce((prevEntry, currEntry) => {
      return currEntry.categoryValue.name === attribute
        ? currEntry.count + prevEntry
        : prevEntry;
    }, 0);
  };

  const sumOfRecordsByAttribute = (
    records: readonly GetDataset_dataset_records[],
    attribute: string
  ) => {
    return records.reduce((prev, curr) => {
      return prev + sumOfEntriesByAttribute(curr.entries, attribute);
    }, 0);
  };

  const percentOfAttribute = (
    records: readonly GetDataset_dataset_records[],
    categoryValue: GetDataset_dataset_program_targets_categoryValue
  ) => {
    return Math.round(
      (sumOfRecordsByAttribute(records, categoryValue.name) /
        sumOfRecordsByAttributeCategory(records, categoryValue.category.name)) *
        100
    );
  };

  const groupedByMonthYearRecords = useMemo(() => {
    const lang = window.navigator.language;
    return sortedRecords?.reduce((acc: Record<string, Array<IEntry>>, curr) => {
      const recordDate = new Date(curr.publicationDate);
      const monthName = new Intl.DateTimeFormat(lang, {
        month: "long",
      }).format(recordDate);
      const monthYear = `${monthName} ${recordDate.getFullYear()}`;
      if (acc[monthYear]) {
        return acc[monthYear].reduce(
          (monthYearRecords: Record<string, Array<IEntry>>, entry: IEntry) => {
            if (!monthYearRecords[monthYear]) {
              monthYearRecords[monthYear] = [];
            }
            monthYearRecords[monthYear].push({
              ...entry,
              AttributeCount: (entry.AttributeCount += sumOfEntriesByAttribute(
                curr.entries,
                entry.Attribute
              )),
              AttributeCategoryCount: (entry.AttributeCategoryCount +=
                sumOfEntriesByAttributeCategory(
                  curr.entries,
                  entry.AttributeCategory
                )),
            });
            return monthYearRecords;
          },
          {} as Record<string, Array<IEntry>>
        );
      } else {
        const newMonthYearRecord = (
          entry: GetDataset_dataset_records_entries
        ) => {
          return {
            MonthYear: monthYear,
            Attribute: entry.categoryValue.name,
            AttributeCategory: entry.categoryValue.category.name,
            AttributeCount: entry.count,
            AttributeCategoryCount: sumOfEntriesByAttributeCategory(
              curr.entries,
              entry.categoryValue.category.name
            ),
            Target: queryData?.dataset.program.targets.find(
              (target) => target.categoryValue.name === entry.categoryValue.name
            )?.target,
            Percent: undefined,
          };
        };
        acc[monthYear] = curr.entries.reduce((newMY, entry) => {
          newMY.push(newMonthYearRecord(entry));
          return newMY;
        }, new Array<IEntry>());
      }
      return acc;
    }, {} as Record<string, Array<IEntry>>);
  }, [sortedRecords]);

  interface customColumnConfig extends ColumnConfig {
    title: string;
  }

  const progressConfig = (
    chartData: IEntry[],
    target: number,
    title: string
  ) => {
    const config: customColumnConfig = {
      title: title,
      data: chartData,
      xField: "MonthYear",
      yField: "Percent",
      annotations: [
        {
          type: "line",
          top: true,
          start: ["start", target],
          end: ["end", target],
          style: {
            stroke: "red",
          },
        },
        {
          type: "text",
          top: true,
          position: ["median", target],
          content: `${target}%`,
          style: {
            fontSize: 20,
            textAlign: "center",
            textBaseline: "bottom",
            stroke: "red",
          },
        },
      ],
      conversionTag: {
        text: {
          style: {
            fontSize: 25,
          },
          formatter: (prev: number, next: number) => {
            const val = next - prev;
            return `${
              Math.sign(val) == -1 || Math.sign(val) == 0 ? "-" : "+"
            }${Math.abs(val)}%`;
          },
        },
      },
      yAxis: {
        max: 100,
        label: {
          formatter: (text) => `${text}%`,
        },
      },
      xAxis: {
        label: {
          autoHide: true,
          autoRotate: false,
        },
      },
    };
    return config;
  };

  const progressCharts: customColumnConfig[] = useMemo(() => {
    return (
      queryData?.dataset?.program.targets
        .filter((x) => x.target > 0.0)
        .reduce((configs, target) => {
          if (
            groupedByMonthYearRecords &&
            Object.keys(groupedByMonthYearRecords).length > 1
          ) {
            const chartData = Object.values(groupedByMonthYearRecords).reduce(
              (entryArray, record) => {
                const targetEntry = record.find(
                  (x) => x.Attribute == target.categoryValue.name
                );
                if (targetEntry) {
                  entryArray.push({
                    ...targetEntry,
                    Percent: Math.round(
                      (targetEntry.AttributeCount /
                        targetEntry.AttributeCategoryCount) *
                        100
                    ),
                  });
                }
                return entryArray;
              },
              new Array<IEntry>()
            );
            if (chartData.length > 1) {
              configs.push(
                progressConfig(
                  [chartData[0], chartData[chartData.length - 1]],
                  Math.round(target.target * 100),
                  target.categoryValue.name
                )
              );
            }
          }
          return configs;
        }, [] as customColumnConfig[]) ?? new Array<customColumnConfig>()
    );
  }, [groupedByMonthYearRecords, queryData?.dataset?.program.targets]);

  const filteredRecords = useMemo(() => {
    if (selectedFilters && sortedRecords) {
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
          return sortedRecords.filter(
            (record: GetDataset_dataset_records) =>
              moment(record.publicationDate) >= from &&
              moment(record.publicationDate) <= to
          );
        }
      }
    }
    setPresetDate("All Time");
    return queryData?.dataset?.records;
  }, [sortedRecords, selectedFilters]);

  const targetStates = useMemo(() => {
    return queryData?.dataset?.program.targets
      .filter((x) => x.target > 0.0)
      .map((target) => ({
        name: target.categoryValue.name,
        target: target.target,
        status: filteredRecords
          ? percentOfAttribute(filteredRecords, target.categoryValue)
          : 0,
      }));
  }, [queryData?.dataset?.program.targets, filteredRecords]);

  const generateGuageConfig = (target: {
    name: string;
    target: number;
    status: number;
  }) => {
    return {
      width: 150,
      height: 150,
      innerRadius: 0.8,
      percent: target.status / 100,
      range: {
        ticks: [0, target.target, 1],
        color: ["#F4664A", "#30BF78"],
      },
      axis: {
        label: {
          formatter: (v: string) => {
            return Number(v) * 100;
          },
        },
        subTickLine: { count: 3 },
      },
      indicator: {
        pointer: { style: { stroke: "#D0D0D0" } },
        pin: { style: { stroke: "#D0D0D0" } },
      },
      statistic: {
        content: {
          formatter: () => {
            return `${target.status}%`;
          },
          style: {
            fontSize: "18px",
            lineHeight: "18px",
          },
        },
      },
    };
  };

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

  const noDataAvailable = () => (
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
  );

  return (
    <div className="dataset-details_container">
      <PageTitleBar
        title={queryData?.dataset?.program.name}
        subtitle={queryData?.dataset?.name}
        extra={[
          <Space key="0" size="middle">
            {presetDate ? <Text strong>{t(presetDate)}</Text> : null}
            <RangePicker
              format={(val) =>
                Intl.DateTimeFormat(window.navigator.language, {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }).format(val.toDate())
              }
              value={
                selectedFilters?.DateRange?.length == 2
                  ? [
                      selectedFilters?.DateRange[0],
                      selectedFilters.DateRange[1],
                    ]
                  : [null, null]
              }
              ranges={PresetDateRanges}
              onChange={onChangeDateRange}
            />
          </Space>,
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
      {filteredRecords?.length || progressCharts.length ? (
        <Tabs defaultActiveKey={progressCharts.length ? "progress" : "current"}>
          {progressCharts.length && (
            <TabPane tab="Progress" key="progress">
              <Tabs defaultActiveKey="Cisgender women">
                {progressCharts &&
                  progressCharts.map((config, i) => (
                    <TabPane key={i} tab={config.title}>
                      <Column {...config} />
                    </TabPane>
                  ))}
              </Tabs>
            </TabPane>
          )}

          <TabPane
            tab={presetDate ? presetDate : "Selected Range"}
            key="current"
          >
            {filteredRecords?.length ? (
              <Row justify="center">
                {targetStates
                  ?.filter((x) => !isNaN(x.status))
                  .map((target) => (
                    <Col
                      key={target.name}
                      span={
                        targetStates?.length
                          ? Math.round(24 / targetStates?.length)
                          : 5
                      }
                    >
                      <Gauge {...generateGuageConfig(target)} />
                      <Card>
                        <Statistic
                          title={target.name}
                          value={target.status - target.target * 100}
                          suffix="%"
                          prefix={
                            target.status / 100 >= target.target ? (
                              <UpCircleTwoTone twoToneColor="green" />
                            ) : (
                              <DownCircleTwoTone twoToneColor="red" />
                            )
                          }
                        />
                      </Card>
                    </Col>
                  ))}
              </Row>
            ) : (
              noDataAvailable()
            )}
          </TabPane>
          <TabPane tab="Details">
            {filteredRecords?.length ? (
              <Space direction="vertical">
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
              </Space>
            ) : (
              noDataAvailable()
            )}
          </TabPane>
        </Tabs>
      ) : (
        noDataAvailable()
      )}
    </div>
  );
};

export { DatasetDetails };
