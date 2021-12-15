import { Column, ColumnConfig } from "@ant-design/charts";
import BarChartOutlined from "@ant-design/icons/lib/icons/BarChartOutlined";

import { useMutation, useQuery } from "@apollo/client";
import {
  Button,
  Col,
  Collapse,
  DatePicker,
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
import { useParams } from "react-router-dom";
import { IDatasetDetailsFilter } from "../../components/DatasetDetailsFilterProvider";
import { Loading } from "../../components/Loading/Loading";
import { PageTitleBar } from "../../components/PageTitleBar";
import {
  GetDataset,
  GetDatasetVariables,
  GetDataset_dataset_personTypes,
  GetDataset_dataset_program_targets_category,
  GetDataset_dataset_records,
  GetDataset_dataset_records_entries,
} from "../../graphql/__generated__/GetDataset";
import { GET_DATASET } from "../../graphql/__queries__/GetDataset.gql";
import { DELETE_PUBLISHED_RECORD_SET } from "../../graphql/__mutations__/DeletePublishedRecordSet.gql";
import { DataEntryTable } from "../DataEntry/DataEntryTable";
import { DatasetDetailsScoreCard } from "./DatasetDetailsScoreCard";
import "./DatasetDetails.css"
import { DatasetDetailsRecordsTable } from "./DatasetDetailsRecordsTable";
import { IPublishedRecordSetDocument, PublishedRecordSet } from "./PublishedRecordSet";
import CloseCircleOutlined from "@ant-design/icons/lib/icons/CloseCircleOutlined";
import Pie5050 from "../Charts/Pie";

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
  AttributeCategoryCount: number | undefined;
  AttributeCount: number;
  PersonType: string | undefined;
  Percent: number | undefined;
  Target: number | undefined;
  TargetMember: boolean | undefined;
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


export const getPalette = (targetCategory: string) => {
  switch (targetCategory) {
    case "Gender":
      return ["rgba(255,51,0,1)", "rgba(46,117,182,1)"];
    case "Ethnicity":
      return ["rgba(112,48,160,1)", "rgba(189,215,238,1)"];
    case "Disability":
      return ["rgba(255,255,0,1)", "rgba(255,192,0,1)"];
    default:
      return ["rgba(255,51,0,1)", "rgba(46,117,182,1)"];
  }
};

const DatasetDetails = (): JSX.Element => {
  const { datasetId } = useParams<RouteParams>();
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

  const [deletePublishedRecordSet] = useMutation(
    DELETE_PUBLISHED_RECORD_SET,
    {
      refetchQueries: [
        {
          query: GET_DATASET,
          variables: {
            id: datasetId
          }
        }
      ],
    }
  );


  const sumOfEntriesByAttributeCategory = (
    entries: readonly GetDataset_dataset_records_entries[],
    attributeCategory: GetDataset_dataset_program_targets_category,
    personType: GetDataset_dataset_personTypes | undefined
  ) => {
    return entries.reduce((prevEntry, currEntry) => {
      const personTypeBool =
        personType !== undefined
          ? currEntry.personType?.id === personType.id
          : true;
      return currEntry.categoryValue.category.id === attributeCategory.id &&
        personTypeBool
        ? currEntry.count + prevEntry
        : prevEntry;
    }, 0);
  };

  const sumOfRecordsByAttributeCategory = (
    records: readonly GetDataset_dataset_records[],
    attributeCategory: GetDataset_dataset_program_targets_category,
    personType: GetDataset_dataset_personTypes | undefined
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

  /*const sumOfEntriesByAttribute = (
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
  };*/

  const sumOfEntriesByInTargetAttribute = (
    entries: readonly GetDataset_dataset_records_entries[],
    personType: GetDataset_dataset_personTypes | undefined,
    attributesInTarget: string[]
  ) => {
    return entries.reduce((prevEntry, currEntry) => {
      const personTypeBool =
        personType !== undefined
          ? currEntry.personType?.id === personType.id
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
    personType: GetDataset_dataset_personTypes | undefined,
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
    category: GetDataset_dataset_program_targets_category,
    personType: GetDataset_dataset_personTypes | undefined,
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


  const progressConfig = (
    chartData: IEntry[],
    target: number,
    title: string
  ) => {
    const config: customColumnConfig = {
      title: title,
      data: chartData,
      color: ({ Attribute }) =>
        Attribute.indexOf("Other") > -1 ? getPalette(title)[1] : getPalette(title)[0],
      columnStyle: { stroke: "black" },
      padding: 30,
      height: 300,
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
          return { name: item.Attribute.indexOf("Other") > -1 ? "Other" : `${item.Attribute} target`, value: labelString };
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
    monthYear: string
  ) => {
    return {
      MonthYear: monthYear,
      Attribute: entry.categoryValue.name,
      AttributeCategory: entry.categoryValue.category.name,
      AttributeCategoryCount: undefined,
      AttributeCount: entry.count,
      PersonType: undefined, //entry.personType?.personTypeName,
      Target: queryData?.dataset.program.targets.find(x => x.category.id === entry.categoryValue.category.id)?.target,
      TargetMember: queryData?.dataset.program.targets
        .find(x => x.category.id === entry.categoryValue.category.id)?.
        tracks.find(x => x.categoryValue.id === entry.categoryValue.id)?.
        targetMember,
      Percent: undefined,
    };
  };

  const isTargetMember = (categoryValueId: string) => {
    return queryData?.dataset.program.targets
      .flat()
      .flatMap(x => x.tracks)
      .find((track) => track.categoryValue.id === categoryValueId)
      ?.targetMember ?? false
  }

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
              Number(isTargetMember(a.categoryValue.id)) - Number(isTargetMember(b.categoryValue.id))
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
    return queryData?.dataset?.program.targets.map((target) => {
      const status = filteredRecords
        ? percentOfInTargetAttributeCategories(
          filteredRecords,
          target.category,
          undefined,
          queryData?.dataset?.program.targets
            .find((x) => x.category.id === target.category.id)
            ?.tracks
            .filter(x => x.targetMember)
            .map((x) => x.categoryValue.name) ?? new Array<string>()
        )
        : 0;
      return { target: target, status: status };
    })
      .sort((a, b) => b.target.target - a.target.target);
  }, [queryData?.dataset?.program.targets, filteredRecords]);

  const groupedByMonthYearRecords = useMemo(() => {
    return sortedRecords?.reduce((groupedByMonthYearRecords, curr) => {
      const recordDate = new Date(curr.publicationDate);
      const monthName = new Intl.DateTimeFormat(window.navigator.language, {
        month: "short",
      }).format(recordDate);
      const monthYear = `${monthName} ${recordDate.getFullYear()}`;
      //reduced to ignore people types
      const reducedEntries = curr.entries.reduce((newEntries, entry) => {
        const oldEntry = newEntries[entry.categoryValue.name];
        if (!oldEntry) {
          newEntries[entry.categoryValue.name] = newMonthYearRecord(entry, monthYear);
        }
        else {
          newEntries[entry.categoryValue.name] =
          {
            ...oldEntry,
            AttributeCount: oldEntry.AttributeCount + entry.count
          };
        }
        return newEntries;
      }, {} as Record<string, IEntry>);


      if (!groupedByMonthYearRecords[monthYear]) {
        groupedByMonthYearRecords[monthYear] = Object.values(reducedEntries);
      }
      else {
        Object.values(reducedEntries).forEach((entry) => {
          const entryIdx = groupedByMonthYearRecords[monthYear].findIndex(x => x.Attribute === entry.Attribute);
          const oldEntry = groupedByMonthYearRecords[monthYear][entryIdx]
          if (entryIdx === -1) {
            groupedByMonthYearRecords[monthYear].push(entry);
          }
          else {
            groupedByMonthYearRecords[monthYear][entryIdx] =
            {
              ...oldEntry,
              AttributeCount: oldEntry.AttributeCount + entry.AttributeCount
            };
          }

        });
      }
      return groupedByMonthYearRecords;
    }, {} as Record<string, IEntry[]>);

  }, [sortedRecords]);

  const progressCharts: customColumnConfig[] | undefined = useMemo(() => {
    //return Array.from(new Set(queryData?.dataset.program.targets.map(x => x.categoryValue.category.name)))
    //yes this is a bit hard to read!
    if (
      !groupedByMonthYearRecords ||
      Object.keys(groupedByMonthYearRecords).length < 2
    ) { return undefined; }
    return Array.from(queryData?.dataset?.program.targets ?? [])
      .sort((a, b) => b.target - a.target)
      .reduce(
        (configs, target) => {
          const chartData = Object.values(groupedByMonthYearRecords).reduce(
            (chartData, record) => {
              const totalAttributeCategoryCount = record
                .filter(x => x.AttributeCategory === target.category.name)
                .reduce((count, currEntry) => {
                  count += currEntry.AttributeCount;
                  return count;
                }, 0);
              if (totalAttributeCategoryCount === 0) {
                return chartData;
              }
              const reducedRecord = record
                .filter(x => x.AttributeCategory === target.category.name)
                .reduce((reducedRecord, currEntry) => {
                  let categoryKey = target.category.name;
                  if (!currEntry.TargetMember) {
                    categoryKey = `Other ${target.category.name}`;
                  }

                  if (reducedRecord[categoryKey]) {
                    reducedRecord[categoryKey].AttributeCount += currEntry.AttributeCount;
                    reducedRecord[categoryKey].Percent = (reducedRecord[categoryKey].AttributeCount / totalAttributeCategoryCount) * 100
                  } else {
                    reducedRecord[categoryKey] = {
                      ...currEntry,
                      Attribute: categoryKey,
                      AttributeCategoryCount: totalAttributeCategoryCount,
                      Percent: (currEntry.AttributeCount / totalAttributeCategoryCount) * 100
                    };
                  }
                  return reducedRecord;
                }, {} as Record<string, IEntry>);
              if (Object.values(reducedRecord).length === 1) return chartData;
              Object.values(reducedRecord).forEach(x => chartData.push(x));
              return chartData;
            }, new Array<IEntry>());
          if (chartData.length > 1) {
            configs.push(
              progressConfig(
                [
                  ...chartData.slice(-6).map((x) => ({
                    ...x,
                    PersonType: x.PersonType
                      ? x.PersonType
                      : t("unknownPersonType"),
                  })),
                ],
                Math.round(target.target * 100),
                target.category.name
              )
            );
          }
          else {
            configs.push({} as customColumnConfig)
          }

          return configs;
        },
        ([] as customColumnConfig[]) ?? new Array<customColumnConfig>()
      )
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

  const dateRangePicker = <Space key="0" size="middle">

    {presetDate && <Text strong>{t(presetDate)}</Text>}
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
  </Space>

  return (
    <div className="dataset-details_container">
      <Row gutter={[0, 40]}>
        <Col span={24}>
          <PageTitleBar
            title={queryData?.dataset?.program.name}
            subtitle={queryData?.dataset?.name}

          />
        </Col>

        <Col span={24}>
          <Tabs defaultActiveKey={progressCharts ? "progress" : "current"} tabBarExtraContent={dateRangePicker}>

            <TabPane tab="Progress" key="progress">
              <h2>{presetDate}</h2>
              <Row justify="center" gutter={[0, 50]}>
                {
                  targetStates?.map((targetState, i) => (
                    <Col key={i} span={4} offset={i ? 4 : 0}>
                      {!isNaN(targetState.status) ? (
                        <Pie5050
                          legend={false}
                          categoryName={targetState.target.category.name}
                          target={targetState.target.target * 100}
                          status={targetState.status}
                        />
                      ) : (
                        noDataAvailable()
                      )}
                      <h2 style={{ textAlign: "center" }}>{targetState.target.category.name}</h2>
                    </Col>
                  ))
                }
                <Col span={24}>
                  <Collapse>
                    <Panel className="customPanel" showArrow={true} header={<span style={{ fontSize: "1.5rem" }}>3 Month Trend</span>} extra={<BarChartOutlined style={{ fontSize: "2rem", fontWeight: 600 }} />} key="1">
                      {
                        <Row justify="center">
                          {
                            progressCharts && progressCharts.length ? progressCharts.map(
                              (config, i) =>
                                <Col span={4} offset={i ? 4 : 0} key={i}>
                                  {
                                    config && Object.keys(config).length ? <Column {...config} /> : null
                                  }
                                </Col>

                            ) : noDataAvailable()
                          }
                        </Row>
                      }
                    </Panel>
                  </Collapse>
                </Col>
                <Col span={24}>
                  <DataEntryTable
                    id={datasetId}
                  />
                </Col>
              </Row>
            </TabPane>
            <TabPane tab="Details">
              {
                filteredRecords?.length ? (
                  <Row>
                    <Col span={24}>
                      <DatasetDetailsScoreCard
                        data={queryData}
                        datasetId={datasetId}
                        filteredRecords={filteredRecords}
                      />
                    </Col>
                    <Col span={24}>
                      <DatasetDetailsRecordsTable
                        datasetId={datasetId}
                        datasetData={queryData}
                        records={filteredRecords}
                        isLoading={queryLoading}

                      />
                    </Col>
                  </Row>
                ) : (
                  noDataAvailable()
                )
              }
            </TabPane>
            <TabPane tab="Published" key="published">
              {
                queryData?.dataset.publishedRecordSets?.length ?
                  <Collapse>
                    {
                      queryData?.dataset.publishedRecordSets?.map(prs =>
                        <Panel
                          key={prs.reportingPeriodId}
                          header={
                            `${moment(prs.begin).format("D MMM YY")} - ${moment(prs.end).format("D MMM YY")}`
                          }
                          extra={
                            <Button
                              tabIndex={-1}
                              type="text"
                              danger
                              title={t("deletePublishedRecordSet")}
                              aria-label={t("deletePublishedRecordSet")}
                              icon={<CloseCircleOutlined />}
                              onClick={async () => await deletePublishedRecordSet({
                                variables: {
                                  id: prs.id
                                }
                              })
                                .then(() => console.log("Deleted!"))
                                .catch((e) => alert(e))
                              }
                            />
                          }
                        >
                          <PublishedRecordSet document={prs.document as IPublishedRecordSetDocument} />
                        </Panel>
                      )
                    }
                  </Collapse>
                  : <h3>{t("noPublishedRecordSets")}</h3>
              }
            </TabPane>
          </Tabs>
        </Col>

      </Row>
    </div >
  );
};

export { DatasetDetails };
