import { Column, ColumnConfig, Pie } from "@ant-design/charts";
import { PlusOutlined } from "@ant-design/icons";
import BarChartOutlined from "@ant-design/icons/lib/icons/BarChartOutlined";
import { Datum } from "@antv/g2plot";
import { useQuery } from "@apollo/client";
import {
  Button,
  Col,
  Collapse,
  DatePicker,
  Divider,
  Row,
  Space,
  Tabs,
  Typography,
} from "antd";
const { Panel } = Collapse;
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
  GetDataset_dataset_records,
  GetDataset_dataset_records_entries,
} from "../../graphql/__generated__/GetDataset";
import { GET_DATASET } from "../../graphql/__queries__/GetDataset.gql";
import { DataEntryTable } from "../DataEntry/DataEntryTable";
import { DatasetDetailsRecordsTable } from "./DatasetDetailsRecordsTable";
import { DatasetDetailsScoreCard } from "./DatasetDetailsScoreCard";
const { TabPane } = Tabs;
const { Text } = Typography;
const { RangePicker } = DatePicker;

interface RouteParams {
  datasetId: string;
}

interface customColumnConfig extends ColumnConfig {
  title: string;
}

interface IEntry {
  MonthYear: string;
  Attribute: string;
  AttributeCategory: string;
  AttributeCount: number;
  AttributeCategoryCount: number;
  PersonType: string | undefined;
  Percent: number | undefined;
  Target: number | undefined;
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

const getTarget = (targetCategory: string) => {
  switch (targetCategory) {
    case "Gender":
      return 0.5;
    case "Race / ethnicity":
      return 0.2;
    case "Disability":
      return 0.12;
    default:
      return 0.0;
  }
};

const getPalette = (targetCategory: string) => {
  switch (targetCategory) {
    case "Gender":
      return ["rgba(255,51,0,1)", "rgba(46,117,182,1)"];
    case "Race / ethnicity":
      return ["rgba(112,48,160,1)", "rgba(189,215,238,1)"];
    case "Disability":
      return ["rgba(255,255,0,1)", "rgba(255,192,0,1)"];
    default:
      return ["rgba(255,51,0,1)", "rgba(46,117,182,1)"];
  }
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

  const sumOfEntriesByAttributeCategory = (
    entries: readonly GetDataset_dataset_records_entries[],
    attributeCategory: string,
    personType: string | undefined
  ) => {
    return entries.reduce((prevEntry, currEntry) => {
      const personTypeBool =
        personType !== undefined
          ? currEntry.personType?.personTypeName === personType
          : true;
      return currEntry.categoryValue.category.name === attributeCategory &&
        personTypeBool
        ? currEntry.count + prevEntry
        : prevEntry;
    }, 0);
  };

  const sumOfRecordsByAttributeCategory = (
    records: readonly GetDataset_dataset_records[],
    attributeCategory: string,
    personType: string | undefined
  ) => {
    return records.reduce((prev, curr) => {
      return (
        prev +
        sumOfEntriesByAttributeCategory(
          curr.entries,
          attributeCategory,
          personType
        )
      );
    }, 0);
  };

  const sumOfEntriesByAttribute = (
    entries: readonly GetDataset_dataset_records_entries[],
    attribute: string,
    personType: string | undefined
  ) => {
    return entries.reduce((prevEntry, currEntry) => {
      const personTypeBool =
        personType !== undefined
          ? currEntry.personType?.personTypeName === personType
          : true;
      return currEntry.categoryValue.name === attribute && personTypeBool
        ? currEntry.count + prevEntry
        : prevEntry;
    }, 0);
  };

  const sumOfEntriesByInTargetAttribute = (
    entries: readonly GetDataset_dataset_records_entries[],
    personType: string | undefined,
    attributesInTarget: string[]
  ) => {
    return entries.reduce((prevEntry, currEntry) => {
      const personTypeBool =
        personType !== undefined
          ? currEntry.personType?.personTypeName === personType
          : true;
      const inTargetBool = attributesInTarget.includes(
        currEntry.categoryValue.name
      );
      return personTypeBool && inTargetBool
        ? currEntry.count + prevEntry
        : prevEntry;
    }, 0);
  };

  const sumOfRecordsByInTargetAttribute = (
    records: readonly GetDataset_dataset_records[],
    personType: string | undefined,
    attributesInTarget: string[]
  ) => {
    return records.reduce((prev, curr) => {
      return (
        prev +
        sumOfEntriesByInTargetAttribute(
          curr.entries,
          undefined, //personType, this causes personType to be ignored in the sum
          attributesInTarget
        )
      );
    }, 0);
  };

  const percentOfInTargetAttributeCategories = (
    records: readonly GetDataset_dataset_records[],
    category: string,
    personType: string | undefined,
    attributesInTarget: string[]
  ) => {
    return Math.round(
      (sumOfRecordsByInTargetAttribute(
        records,
        personType,
        attributesInTarget
      ) /
        sumOfRecordsByAttributeCategory(records, category, personType)) *
      100
    );
  };

  const generatePieConfig = (target: {
    name: string;
    target: number;
    status: number;
  }) => {
    return {
      width: 150,
      height: 150,
      data: [
        { targetName: target.name, value: target.status },
        { targetName: "Other", value: 100 - target.status },
      ],
      innerRadius: 0.5,
      angleField: "value",
      colorField: "targetName",
      color: (datum: Datum) => {
        return datum.targetName === "Other"
          ? getPalette(target.name)[1]
          : getPalette(target.name)[0];
      },
      tooltip: {
        formatter: (datum: Datum) => datum.targetName === "Other" ? { name: "Not in target", value: `${datum.value}%` } : {
          value: `${datum.value}%`, name: `${datum.targetName} target`
        }
      },
      //percent: target.status / 100,
      legend: false,
      statistic: () => undefined,
      label: false,
    };
  };

  const progressConfig = (
    chartData: IEntry[],
    target: number,
    title: string
  ) => {
    const config: customColumnConfig = {
      title: title,
      data: chartData,
      color: ({ Attribute }) =>
        Attribute === "Other" ? getPalette(title)[1] : getPalette(title)[0],
      columnStyle: { stroke: "black" },
      padding: 70,
      xField: "MonthYear",
      yField: "Percent",
      intervalPadding: 0,
      seriesField: "Attribute",
      isStack: true,
      isPercent: true,
      annotations: [
        {
          type: "line",
          top: true,
          start: ["-5%", 100 - target],
          end: ["105%", 100 - target],
          style: {
            lineWidth: 3,
            stroke: "black",
          },
          text: {
            content: "",
            position: "start",
            offsetY: 10,
            offsetX: -35,
            style: { fontSize: 20, fontWeight: 300 },
          },
        },
      ],
      legend: false,
      tooltip: {
        formatter: function content(item) {
          const labelString = `${Math.round(item.Percent * 100)}% `;
          return { name: item.Attribute === "Other" ? "Other" : `${item.Attribute} target`, value: labelString };
        },
      },
      yAxis: {
        tickCount: 0,
        max: 100,
        /*label: {
          formatter: (text) => `${ Math.round(parseFloat(text) * 100) }% `,
        },*/
        label: null,
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

  const newMonthYearRecord = (
    entry: GetDataset_dataset_records_entries,
    monthYear: string,
    record: GetDataset_dataset_records
  ) => {
    return {
      MonthYear: monthYear,
      Attribute: entry.categoryValue.name,
      AttributeCategory: entry.categoryValue.category.name,
      AttributeCount: entry.count,
      PersonType: undefined, //entry.personType?.personTypeName,
      AttributeCategoryCount: sumOfEntriesByAttributeCategory(
        record.entries,
        entry.categoryValue.category.name,
        undefined //entry.personType?.personTypeName Ignore PersonType in count
      ),
      Target: queryData?.dataset.program.targets.find(
        (target) => target.categoryValue.name === entry.categoryValue.name
      )?.target,
      Percent: undefined,
    };
  };

  const sortedRecords = useMemo(() => {
    if (queryData?.dataset?.records) {
      return Array.from(queryData.dataset.records)
        .sort(
          (a, b) =>
            Date.parse(a.publicationDate) - Date.parse(b.publicationDate)
        )
        .map((x) => ({
          ...x,
          entries: Array.from(x.entries).sort(
            (a, b) =>
              (queryData.dataset.program.targets.find(
                (target) => target.categoryValue.id === a.categoryValue.id
              )?.target ?? 0) -
              (queryData.dataset.program.targets.find(
                (target) => target.categoryValue.id === b.categoryValue.id
              )?.target ?? 0)
          ),
        }));
    }
  }, [queryData]);

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
    return ["Gender", "Race / ethnicity", "Disability"].map((target) => {
      const status = filteredRecords
        ? percentOfInTargetAttributeCategories(
          filteredRecords,
          target,
          undefined,
          queryData?.dataset?.program.targets
            .filter(
              (x) => x.target > 0 && x.categoryValue.category.name === target
            )
            .map((x) => x.categoryValue.name) ?? new Array<string>()
        )
        : 0;
      return {
        name: target,
        target: getTarget(target),
        offset: status - getTarget(target) * 100,
        status: status,
      };
    });
  }, [queryData?.dataset?.program.targets, filteredRecords]);

  const groupedByMonthYearRecords = useMemo(() => {
    const lang = window.navigator.language;
    const test = sortedRecords?.reduce((acc: Record<string, Array<IEntry>>, curr) => {
      const recordDate = new Date(curr.publicationDate);
      const monthName = new Intl.DateTimeFormat(lang, {
        month: "long",
      }).format(recordDate);
      const monthYear = `${monthName} ${recordDate.getFullYear()} `;
      const newMonthYearEntries = curr.entries.reduce((newEntries, entry) => {
        if (acc[monthYear]) {
          const oldEntry = acc[monthYear].find(x => x.Attribute === entry.categoryValue.name);
          if (!oldEntry) {
            newEntries.push(newMonthYearRecord(entry, monthYear, curr));
          }
          else {
            newEntries.push(
              {
                ...oldEntry,
                AttributeCount: (oldEntry.AttributeCount += sumOfEntriesByAttribute(
                  curr.entries,
                  oldEntry.Attribute,
                  undefined //entry.PersonType Ignore PersonType in count
                )),
                AttributeCategoryCount: (oldEntry.AttributeCategoryCount +=
                  sumOfEntriesByAttributeCategory(
                    curr.entries,
                    oldEntry.AttributeCategory,
                    undefined //entry.PersonType Ignore PersonType in count
                  ))
              });
          }
        }
        else {
          newEntries.push(newMonthYearRecord(entry, monthYear, curr));
        }
        return newEntries;
      }, new Array<IEntry>());
      acc[monthYear] = newMonthYearEntries;
      return acc;
    }, {} as Record<string, Array<IEntry>>);
    return test;
  }, [sortedRecords]);

  const progressCharts: customColumnConfig[] | undefined = useMemo(() => {
    //return Array.from(new Set(queryData?.dataset.program.targets.map(x => x.categoryValue.category.name)))
    //yes this is a bit hard to read!
    return ["Gender", "Race / ethnicity", "Disability"].reduce(
      (configs, targetCategory) => {
        if (
          groupedByMonthYearRecords &&
          Object.keys(groupedByMonthYearRecords).length > 1
        ) {
          const chartData = Object.values(groupedByMonthYearRecords).reduce(
            (reducedByCategoryRecord, record) => {
              const reducedRecord = record
                .filter((x) => x.AttributeCategory === targetCategory)
                .reduce((reducedEntry, currEntry) => {
                  const targetCategoryKey = targetCategory;
                  /*const targetCategoryPersonTypeKey =
                    targetCategory + currEntry.PersonType;*/
                  //here the target number is treated like a bool
                  if (currEntry.Target && currEntry.Target > 0) {
                    if (reducedEntry[targetCategoryKey]) {
                      const newCount = (reducedEntry[
                        targetCategoryKey
                      ].AttributeCount += currEntry.AttributeCount);
                      reducedEntry[targetCategoryKey].AttributeCount = newCount;
                      reducedEntry[targetCategoryKey].Percent =
                        currEntry.AttributeCategoryCount === 0
                          ? 0
                          : newCount / currEntry.AttributeCategoryCount;
                    } else {
                      reducedEntry[targetCategoryKey] = {
                        ...currEntry,
                        Attribute: targetCategory,
                        Percent:
                          currEntry.AttributeCategoryCount === 0
                            ? 0
                            : currEntry.AttributeCount /
                            currEntry.AttributeCategoryCount,
                      };
                    }
                  }
                  return reducedEntry;
                }, {} as Record<string, IEntry>);
              if (reducedRecord && Object.values(reducedRecord).length) {
                Object.values(reducedRecord)
                  .filter((x) => x.AttributeCategoryCount > 0)
                  .map((x) => {
                    reducedByCategoryRecord.push({
                      ...x,
                      Attribute: "Other",
                      AttributeCategory: "Other",
                      AttributeCount:
                        x.AttributeCategoryCount - x.AttributeCount,
                      Percent: x.Percent ? 1 - x.Percent : 1,
                    });
                    reducedByCategoryRecord.push(x);
                  });
              }
              return reducedByCategoryRecord;
            },
            new Array<IEntry>()
          );
          if (chartData.length > 1) {
            configs.push(
              progressConfig(
                [
                  ...chartData.slice(-6).map((x) => ({
                    ...x,
                    PersonType: x.PersonType
                      ? x.PersonType
                      : "Unspecified person type",
                  })),
                ],
                Math.round(getTarget(targetCategory) * 100),
                targetCategory
              )
            );
          }
        }
        return configs;
      },
      ([] as customColumnConfig[]) ?? new Array<customColumnConfig>()
    );
  }, [groupedByMonthYearRecords, queryData?.dataset?.program.targets]);

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
            onClick={() => history.push(`/ dataset / ${datasetId} /entry`)}
          >
            {t("addData")}
          </Button >,
        ]}
      />
      {
        filteredRecords?.length || (progressCharts && progressCharts.length) ? (
          <Tabs defaultActiveKey={progressCharts ? "progress" : "current"}>
            {progressCharts && progressCharts.length && (
              <TabPane tab="Progress" key="progress">
                <h2>{presetDate}</h2>
                <Row justify="center">
                  {targetStates.map((target) => (
                    <Col key={target.name} span={8}>
                      {!isNaN(target.status) ? (
                        <Pie {...generatePieConfig(target)} />
                      ) : (
                        noDataAvailable()
                      )}
                      <h2 style={{ textAlign: "center" }}>{target.name}</h2>
                    </Col>
                  ))
                  }
                </Row>
                <Collapse>
                  <Panel showArrow={true} header={<span style={{ fontSize: "1.5rem" }}>3 Month Trend</span>} extra={<BarChartOutlined style={{ fontSize: "2rem", fontWeight: 600 }} />} key="1">
                    <Row>
                      {progressCharts.map(
                        (config) =>
                          config && (
                            <Col span={8}>
                              <Column {...config} />
                            </Col>
                          )
                      )}

                    </Row>
                  </Panel>
                </Collapse>

              </TabPane>
            )}

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
        )
      }
      <Divider orientation="left" plain>
        Data
      </Divider>
      <DataEntryTable />
    </div >
  );
};

export { DatasetDetails };
