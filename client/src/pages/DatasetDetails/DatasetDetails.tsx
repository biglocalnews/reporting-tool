import { useMutation, useQuery } from "@apollo/client";
import {
  Button,
  Checkbox,
  Col,
  Collapse,
  DatePicker,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Tabs,
  Typography,
} from "antd";
const { Panel } = Collapse;
import moment, { Moment } from "moment";
import { EventValue, RangeValue } from "rc-picker/lib/interface.d";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { IDatasetDetailsFilter, PublishedDateRange } from "../../components/DatasetDetailsFilterProvider";
import { Loading } from "../../components/Loading/Loading";
import { PageTitleBar } from "../../components/PageTitleBar";
import {
  GetDataset,
  GetDatasetVariables
} from "../../graphql/__generated__/GetDataset";
import { GET_DATASET } from "../../graphql/__queries__/GetDataset.gql";
import { DELETE_PUBLISHED_RECORD_SET } from "../../graphql/__mutations__/DeletePublishedRecordSet.gql";
import { DataEntryTable } from "../DataEntry/DataEntryTable";
import { DatasetDetailsScoreCard } from "./DatasetDetailsScoreCard";
import "./DatasetDetails.css"
import { DatasetDetailsRecordsTable } from "./DatasetDetailsRecordsTable";
import { flattenPublishedDocumentEntries, IPublishedRecordSetDocument, PublishedRecordSet } from "./PublishedRecordSet";
import CloseCircleOutlined from "@ant-design/icons/lib/icons/CloseCircleOutlined";
import Pie5050 from "../Charts/Pie";
import { LineColumn } from "../Charts/LineColumn";
import { targetStates, filteredRecords } from "../../selectors/TargetStates";
import { flattened, grouped, IChartData } from "../../selectors/ChartData";

const { TabPane } = Tabs;
const { Text } = Typography;
const { RangePicker } = DatePicker;


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
      return ["rgba(46,117,182,1)", "rgba(255,51,0,1)"];
    case "Ethnicity":
      return ["rgba(189,215,238,1)", "rgba(112,48,160,1)"];
    case "Disability":
      return ["rgba(255,255,0,1)", "rgba(255,192,0,1)"];
    default:
      return ["rgba(255,51,0,1)", "rgba(46,117,182,1)"];
  }
};

const DatasetDetails = (): JSX.Element => {
  const { datasetId } = useParams() as { datasetId: string };

  const { t } = useTranslation();
  const defaultPresetDate = "This Month";
  const [activeTab, setActiveTab] = useState("input");
  const [selectedFilters, setSelectedFilters] = useState<IDatasetDetailsFilter>(
    {
      DateRange: PresetDateRanges[defaultPresetDate],
      categories: [] as string[],
      PublishedDateRange: PublishedDateRange.last3Periods
    }
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

  const [deletePublishedRecordSet, { loading: deleting }] = useMutation(
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

  const categories = useMemo(() => {
    return Array.from(new Set(queryData?.dataset.publishedRecordSets?.
      flatMap(x => flattenPublishedDocumentEntries((x.document as IPublishedRecordSetDocument).record).map(x => x.category))));
  }, [queryData?.dataset.publishedRecordSets]);

  const filteredData = useMemo(() => {
    return queryData?.dataset.publishedRecordSets?.
      flat()
      .sort((a, b) => moment(b.end).unix() - moment(a.end).unix())
      .filter(x => {
        if (!selectedFilters.PublishedDateRange || Number(selectedFilters.PublishedDateRange) < 2000) {
          return true;
        } else {
          return moment(x.end).get("year") == Number(selectedFilters.PublishedDateRange);
        }
      })
      .slice(0, Number(selectedFilters.PublishedDateRange))
      .flatMap(x => flattenPublishedDocumentEntries((x.document as IPublishedRecordSetDocument).record)
        .filter(x => !selectedFilters.categories.length || selectedFilters.categories.includes(x.category))
        .map((r) => ({ ...r, date: new Date(x.end) } as IChartData))
      )
  }, [queryData?.dataset.publishedRecordSets, selectedFilters]);

  const chartData = useMemo(() => {
    return flattened(grouped(filteredData));
  }, [filteredData]);

  useEffect(() => {

    if (!selectedFilters.DateRange) return setPresetDate("All Time");

    const presetDate = Object.entries(PresetDateRanges).find(
      ([, v]) => v === selectedFilters.DateRange
    )?.[0];
    if (presetDate) {
      setPresetDate(presetDate);
    } else {
      setPresetDate(null);
    }

  }, [selectedFilters.DateRange]);


  if (!datasetId) return <>bad route</>

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
          <Tabs onTabClick={(key) => setActiveTab(key)} tabBarExtraContent={activeTab !== "published" && dateRangePicker}>
            <TabPane tab="Input" key="input">
              <h2>{presetDate}</h2>
              <Row justify="center" gutter={[0, 50]}>
                {
                  targetStates(queryData, selectedFilters)?.map((targetState, i) => (
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
                        filteredRecords={filteredRecords(queryData, selectedFilters)}
                      />
                    </Col>
                    <Col span={24}>
                      <DatasetDetailsRecordsTable
                        datasetId={datasetId}
                        datasetData={queryData}
                        records={filteredRecords(queryData, selectedFilters)}
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
                  <Row gutter={[16, 16]} justify="center">
                    <Col span={24} style={{ textAlign: "center" }}>
                      <Checkbox.Group
                        options={categories}
                        value={selectedFilters.categories.flat()}
                        onChange={(e) => setSelectedFilters(curr => ({ ...curr, categories: e.map(x => x.toString()) }))}
                      />
                    </Col>
                    <Col span={4} style={{ textAlign: "center" }}>
                      <Select
                        defaultValue={selectedFilters.PublishedDateRange}
                        style={{ width: "100%" }}
                        onChange={(e) => setSelectedFilters((curr) => ({ ...curr, PublishedDateRange: e }))}
                      >
                        {
                          Object.entries(PublishedDateRange)
                            .filter(([k,]) => isNaN(Number(k)))
                            .map(([k, v]) =>
                              <Select.Option value={v} key={k}>
                                {t(`datasetDetails.${PublishedDateRange[Number(v)]}`)}
                              </Select.Option>
                            )
                        }
                        {
                          Array.from(new Set(queryData?.dataset.publishedRecordSets?.
                            map(x => moment(x.end).get("year"))))
                            .sort((a, b) => b - a)
                            .map(year =>
                              <Select.Option value={year} key={year}>
                                {year}
                              </Select.Option>
                            )
                        }
                      </Select>
                    </Col>
                    <Col span={24}>
                      <LineColumn
                        data={chartData}
                        loading={queryLoading}
                        columnOptions={{
                          isGroup: true,
                          groupField: "category",
                          isStack: true,
                          annotations: Array.from(new Set(chartData.map(x => x.category)))
                            .map(category => {
                              const target = queryData.dataset.program.targets.find(y => y.category.name === category)?.target;
                              if (!target) return;
                              return {
                                type: "line",
                                top: true,
                                start: ["-1%", 100 - (target * 100)],
                                end: ["101%", 100 - (target * 100)],
                                style: {
                                  lineWidth: 3,
                                  stroke: getPalette(category)[0],
                                },
                                text: {
                                  content: "",
                                  position: "start",
                                  offsetY: 10,
                                  offsetX: -35,
                                  style: { fontSize: 20, fontWeight: 300 },
                                },
                              };
                            }
                            )
                        }}
                      />
                    </Col>
                    <Col span={24}>

                      <Collapse>
                        {
                          queryData?.dataset.publishedRecordSets?.
                            flat()
                            .sort((a, b) => Date.parse(b.end) - Date.parse(a.end))
                            .map(prs =>
                              <Panel
                                key={prs.reportingPeriodId}
                                header={
                                  `${moment(prs.begin).format("D MMM YY")} - ${moment(prs.end).format("D MMM YY")}`
                                }
                                extra={
                                  <Popconfirm
                                    title={t("confirmDelete")}
                                    onConfirm={async (e) => {
                                      e?.stopPropagation();
                                      await deletePublishedRecordSet({
                                        variables: {
                                          id: prs.id
                                        }
                                      })
                                        .then(() => message.success("Deleted!"))
                                        .catch((e) => message.error(e))
                                    }
                                    }
                                    okButtonProps={{ loading: deleting }}
                                    onCancel={(e) => e?.stopPropagation()}
                                  >
                                    <Button
                                      tabIndex={-1}
                                      type="default"
                                      danger
                                      title={t("datasetDetails.deletePublishedRecordSet")}
                                      aria-label={t("datasetDetails.deletePublishedRecordSet")}
                                      icon={<CloseCircleOutlined />}
                                      onClick={(e) => e.stopPropagation()}
                                    >{t("datasetDetails.unPublish")}</Button>
                                  </Popconfirm>
                                }
                              >
                                <PublishedRecordSet publishedDocument={prs.document as IPublishedRecordSetDocument} />
                              </Panel>
                            )
                        }
                      </Collapse>

                    </Col>
                  </Row>
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

