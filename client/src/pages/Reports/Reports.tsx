import { Column, Line } from "@ant-design/charts";
import { useQuery } from "@apollo/client"
import { Button, Checkbox, Col, Collapse, DatePicker, PageHeader, Row, Select, Space, Statistic, Tag } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import moment from "moment";

const { Panel } = Collapse;
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { GetAllPublishedRecordSets } from "../../graphql/__generated__/GetAllPublishedRecordSets"
import { PublishedRecordSetsInput } from "../../graphql/__generated__/globalTypes";
import { GET_ALL_PUBLISHED_RECORD_SETS } from "../../graphql/__queries__/GetAllPublishedRecordSets.gql"
import Pie5050 from "../Charts/Pie";
import { flattenPublishedDocumentEntries, IPublishedRecordSetDocument } from "../DatasetDetails/PublishedRecordSet";

interface IChartData {
    category: string,
    attribute: string,
    date: Date,
    groupedDate: string,
    percent: number,
    personType: string,
    targetMember: boolean,
    count: number,
    summedPercent: number
}

const chartConfig = (chartData: IChartData[] | undefined, loading: boolean): any => ({
    loading: loading,
    data: chartData ?? [],
    xField: 'groupedDate',
    yField: 'percent',
    seriesField: 'attribute',
    width: 400,
    height: 300,
    legend: {
        position: "right"
    },
    isPercent: true,
    /*color: ({ attribute }) => {
        const { targetMember, category } = chartData?.find(x => x.attribute === attribute) ?? {} as IChartData;
        const allAttributes = new Set(chartData?.filter(x => x.targetMember === targetMember).map(x => x.attribute))
        const colorChangeFactor = 255 / allAttributes.size;
        let color = 0;
        for (const x of Array.from(allAttributes)) {
            if (x === attribute) break;
            const newColor = Math.round(color += colorChangeFactor);
            color = newColor > 255 ? 255 : newColor;
        }
        switch (category) {
            case "Gender":
                return targetMember ? `rgba(255,51,${color},1)` : `rgba(46,117,${color},0.25)`;
            default:
                return targetMember ? "rgba(255,51,0,1)" : "rgba(46,117,182,0.5)";
        }
    }*/
});

const panelStyle = { borderTopLeftRadius: "9px", borderTopRightRadius: "9px" };

export const Reports = () => {
    const [filterState, setFilterState] = useState<PublishedRecordSetsInput>({
        categories: [],
        teams: [],
        tags: [],
        datasetGroups: [],
        year: new Date(Date.now()).getFullYear()
    });

    const [chartMode, setChartMode] = useState("line");

    const { data, loading } = useQuery<GetAllPublishedRecordSets>(GET_ALL_PUBLISHED_RECORD_SETS, {
        variables: {
            //for doing this server side later
            input: { categories: [], teams: [], tags: [], datasetGroups: [], year: new Date(Date.now()).getFullYear() } as PublishedRecordSetsInput
        }
    });

    const { t } = useTranslation();

    const categories = useMemo(() => {
        return Array.from(new Set(data?.publishedRecordSets
            .flatMap(x => flattenPublishedDocumentEntries((x.document as IPublishedRecordSetDocument).record)
                .map((r) => r.category))
        ));
    }, [data]);

    const teams = useMemo(() => {
        return Array.from(new Set(data?.publishedRecordSets
            .map(x => (x.document as IPublishedRecordSetDocument).teamName ?? "None")
        ));
    }, [data]);

    const tags = useMemo(() => {
        return Array.from(new Set(data?.publishedRecordSets
            .flatMap(x => (x.document as IPublishedRecordSetDocument).datasetGroupTags.map(y => y.name))
        ));
    }, [data]);

    const datasetGroups = useMemo(() => {
        return Array.from(new Set(data?.publishedRecordSets
            .map(x => (x.document as IPublishedRecordSetDocument).datasetGroup)
        ));
    }, [data]);

    const filteredData = useMemo(() => {
        return data?.publishedRecordSets
            .filter(x => !filterState.year || filterState.year === new Date(x.end).getFullYear())
            .filter(x => !filterState.teams.length || filterState.teams.includes((x.document as IPublishedRecordSetDocument).teamName))
            .filter(x => !filterState.tags.length || (x.document as IPublishedRecordSetDocument).datasetGroupTags.some(y => filterState.tags.includes(y.name)))
            .filter(x => !filterState.datasetGroups.length || filterState.datasetGroups.includes((x.document as IPublishedRecordSetDocument).datasetGroup))
    }, [data, filterState.year, filterState.tags, filterState.teams, filterState.datasetGroups]);

    const chartData = useMemo(() => {
        return filteredData?.flatMap(x => flattenPublishedDocumentEntries((x.document as IPublishedRecordSetDocument).record)
            .filter(x => !filterState.categories.length || filterState.categories.includes(x.category))
            .map((r) => ({ ...r, date: new Date(x.end) }))
        )
    }, [filterState.categories, filteredData]);

    const grouped: Record<string, IChartData> | undefined = useMemo(() => {
        return (chartData?.reduce((group, entry) => {
            const month = entry.date.getMonth();
            const monthName = new Intl.DateTimeFormat(window.navigator.language, {
                month: "long",
            }).format(entry.date);
            const year = entry.date.getFullYear();
            const monthYear = `${monthName} ${year}`;
            const key = `${monthYear} ${entry.attribute}`
            if (!(key in group)) {
                group[key] = {} as IChartData;
                group[key] = {
                    ...entry,
                    groupedDate: `${year}-${month + 1}-1`,
                    count: 1,
                    summedPercent: entry.percent
                };
                return group;
            }
            group[key].count += 1;
            group[key].summedPercent += entry.percent;
            group[key].percent = (group[key].summedPercent) / group[key].count;
            return group;
        }, {} as Record<string, IChartData>) ?? {} as Record<string, IChartData>)
    }, [chartData]);

    const groupedByYearCategory: Record<string, Record<string, { percent: number, count: number, sum: number }>> = useMemo(() => {
        if (!filteredData) return {} as Record<string, Record<string, { percent: number, count: number, sum: number }>>;
        return filteredData.reduce((groupedRecords, x) => {
            const groupedEntries = flattenPublishedDocumentEntries((x.document as IPublishedRecordSetDocument).record)
                .map((r) => ({ ...r, date: new Date(x.end) }))
                .reduce((groupedEntries, entry) => {
                    const year = entry.date.getFullYear();
                    if (!(year in groupedEntries)) {
                        groupedEntries[year] = {} as Record<string, number>;
                    }
                    if (!(entry.category in groupedEntries[year]) && entry.targetMember) {
                        groupedEntries[year][entry.category] = entry.percent;
                        return groupedEntries;
                    }
                    if (entry.targetMember) {
                        groupedEntries[year][entry.category] += entry.percent;
                    }
                    return groupedEntries
                }, {} as Record<string, Record<string, number>>);
            Object.entries(groupedEntries)
                .forEach(([year, categories]) => {
                    if (!(year in groupedRecords)) {
                        groupedRecords[year] = {} as Record<string, { percent: number, count: number, sum: number }>
                    }
                    Object.entries(categories)
                        .forEach(([category, percent]) => {
                            if (!(category in groupedRecords[year])) {
                                groupedRecords[year][category] = {} as { percent: number, count: number, sum: number };
                                groupedRecords[year][category].sum = percent;
                                groupedRecords[year][category].count = 1;
                                groupedRecords[year][category].percent = percent;
                            }
                            else {
                                groupedRecords[year][category].sum += percent;
                                groupedRecords[year][category].count += 1;
                                groupedRecords[year][category].percent = groupedRecords[year][category].sum / groupedRecords[year][category].count
                            }

                        });
                });

            return groupedRecords;

        }, {} as Record<string, Record<string, { percent: number, count: number, sum: number }>>);

    }, [filteredData]);

    const flattened: IChartData[] | undefined = useMemo(() => {
        return Object.values(grouped).sort((a, b) => a.date.getTime() - b.date.getTime())
    }, [grouped]);

    return <Space direction="vertical">
        <Row justify="center" gutter={[16, 16]}>
            <Col span={24}>
                <PageHeader title={t("reports.title")} subTitle={t("reports.subtitle")} />
            </Col>
            <Col span={6}>
                <Space direction="vertical">
                    <Collapse
                        style={panelStyle}
                    >

                        <Panel
                            header={t("reports.selectCategories")}
                            key="1"
                            extra={
                                <Button
                                    style={{ fontSize: "smaller" }}
                                    size="small"
                                    type="text"
                                    danger
                                    onClick={(e) => {
                                        setFilterState(curr => ({ ...curr, categories: [] }));
                                        e.stopPropagation();
                                    }}
                                >
                                    {t("reports.clear")}
                                </Button>
                            }
                        >
                            <Checkbox.Group
                                options={categories}
                                value={filterState.categories.flat()}
                                onChange={(e) => setFilterState(curr => ({ ...curr, categories: e.map(x => x.toString()) }))}
                            />
                        </Panel>
                    </Collapse>
                    <div style={{ display: "flex" }}>
                        {
                            filterState.categories.map(
                                (x, i) => <Tag
                                    color={"blue"}
                                    key={i}
                                    closable
                                    onClose={(e) => {
                                        e.preventDefault();
                                        setFilterState((curr) => ({ ...curr, categories: curr.categories.filter(y => x !== y) }));
                                    }}
                                >
                                    {x}
                                </Tag>
                            )
                        }
                    </div>
                </Space>
            </Col>
            <Col span={6}>
                <Space direction="vertical">
                    <Collapse
                        style={panelStyle}
                    >
                        <Panel
                            header={t("reports.selectTeams")}
                            key="1"
                            extra={
                                <Button
                                    style={{ fontSize: "smaller" }}
                                    size="small"
                                    type="text"
                                    danger
                                    onClick={(e) => {
                                        setFilterState(curr => ({ ...curr, teams: [] }));
                                        e.stopPropagation();
                                    }}
                                >
                                    {t("reports.clear")}
                                </Button>
                            }
                        >
                            <Checkbox.Group
                                options={teams}
                                value={filterState.teams.flat()}
                                onChange={(e) => setFilterState(curr => ({ ...curr, teams: e.map(x => x.toString()) }))}
                            />
                        </Panel>
                    </Collapse>
                    <div style={{ display: "flex" }}>
                        {
                            filterState.teams.map(
                                (x, i) => <Tag
                                    color={"blue"}
                                    key={i}
                                    closable
                                    onClose={(e) => {
                                        e.preventDefault();
                                        setFilterState((curr) => ({ ...curr, teams: curr.teams.filter(y => x !== y) }));
                                    }}
                                >
                                    {x}
                                </Tag>
                            )
                        }
                    </div>
                </Space>
            </Col>
            <Col span={6}>
                <Space direction="vertical">
                    <Collapse
                        style={panelStyle}
                    >
                        <Panel
                            header={t("reports.selectDatasetGroups")}
                            key="1"
                            extra={
                                <Button
                                    style={{ fontSize: "smaller" }}
                                    size="small"
                                    type="text"
                                    danger
                                    onClick={(e) => {
                                        setFilterState(curr => ({ ...curr, datasetGroups: [] }));
                                        e.stopPropagation();
                                    }}
                                >
                                    {t("reports.clear")}
                                </Button>
                            }
                        >
                            <Checkbox.Group
                                options={datasetGroups}
                                value={filterState.datasetGroups.flat()}
                                onChange={(e) => setFilterState(curr => ({ ...curr, datasetGroups: e.map(x => x.toString()) }))}
                            />
                        </Panel>
                    </Collapse>
                    <div style={{ display: "flex" }}>
                        {
                            filterState.datasetGroups.map(
                                (x, i) => <Tag
                                    color={"blue"}
                                    key={i}
                                    closable
                                    onClose={(e) => {
                                        e.preventDefault();
                                        setFilterState((curr) => ({ ...curr, datasetGroups: curr.datasetGroups.filter(y => x !== y) }));
                                    }}
                                >
                                    {x}
                                </Tag>
                            )
                        }
                    </div>
                </Space>
            </Col>
            <Col span={6}>
                <Space direction="vertical">
                    <Collapse
                        style={panelStyle}
                    >
                        <Panel
                            header={t("reports.selectTags")}
                            key="1"
                            extra={
                                <Button
                                    style={{ fontSize: "smaller" }}
                                    size="small"
                                    type="text"
                                    danger
                                    onClick={(e) => {
                                        setFilterState(curr => ({ ...curr, tags: [] }));
                                        e.stopPropagation();
                                    }}
                                >
                                    {t("reports.clear")}
                                </Button>
                            }
                        >
                            <Checkbox.Group
                                options={tags}
                                value={filterState.tags.flat()}
                                onChange={(e) => setFilterState(curr => ({ ...curr, tags: e.map(x => x.toString()) }))}
                            />
                        </Panel>
                    </Collapse>
                    <div style={{ display: "flex" }}>
                        {
                            filterState.tags.map(
                                (x, i) => <Tag
                                    color={"blue"}
                                    key={i}
                                    closable
                                    onClose={(e) => {
                                        e.preventDefault();
                                        setFilterState((curr) => ({ ...curr, tags: curr.tags.filter(y => x !== y) }));
                                    }}
                                >
                                    {x}
                                </Tag>
                            )
                        }
                    </div>
                </Space>
            </Col>
            <Col span={24} style={{ display: "flex", justifyContent: "center" }}>
                <DatePicker value={moment(`${filterState.year}-01-01`)} onChange={((e) => setFilterState(curr => ({ ...curr, year: e?.year() ?? new Date(Date.now()).getFullYear() })))} picker="year" />
            </Col>

        </Row>
        <Row
            gutter={[16, 16]}
            justify="center"

        >
            <Col span={24}>
                <Row justify="center">
                    {
                        categories
                            .filter(x => !filterState.categories.length || filterState.categories.includes(x))
                            .map((x, i) =>
                                ((filterState.year in groupedByYearCategory) && (x in groupedByYearCategory[filterState.year])) &&
                                <Col span={4} key={i}>
                                    <Space direction="vertical">
                                        <Pie5050
                                            legend={false}
                                            categoryName={x}
                                            status={groupedByYearCategory[filterState.year][x].percent}
                                            target={(() => {
                                                switch (x) {
                                                    case "Gender":
                                                        return 50;
                                                    case "Ethnicity":
                                                        return 20;
                                                    case "Disability":
                                                        return 12;
                                                }
                                            })()
                                            }
                                            attibute={x}
                                        />{
                                            groupedByYearCategory[filterState.year - 1] && groupedByYearCategory[filterState.year - 1][x] &&

                                            <Statistic
                                                value={groupedByYearCategory[filterState.year][x].percent - groupedByYearCategory[filterState.year - 1][x].percent}
                                                precision={2}
                                                valueStyle={{ color: groupedByYearCategory[filterState.year][x].percent - groupedByYearCategory[filterState.year - 1][x].percent === 0 ? "grey" : groupedByYearCategory[filterState.year][x].percent - groupedByYearCategory[filterState.year - 1][x].percent > 0 ? "green" : "red", textAlign: "center" }}
                                                prefix={groupedByYearCategory[filterState.year][x].percent - groupedByYearCategory[filterState.year - 1][x].percent === 0 ? null : groupedByYearCategory[filterState.year][x].percent - groupedByYearCategory[filterState.year - 1][x].percent > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                                suffix="%"
                                            />
                                        }
                                    </Space>
                                </Col>

                            )
                    }
                </Row>

            </Col>

            <Col span={24}>
                <Row>
                    <Col offset={20} span={4}>
                        <Select
                            style={{ width: "130px", float: "right" }}
                            onChange={(e) => setChartMode(e)}
                            defaultValue={chartMode}
                            value={chartMode}
                        >
                            <Select.Option value={"line"}>Line</Select.Option>
                            <Select.Option value={"column"}>Column</Select.Option>
                        </Select>
                    </Col>
                </Row>
            </Col>
            <Col span={24}>
                {
                    chartMode === "line" && <Line
                        {...{ ...chartConfig(flattened, loading), smooth: true, xAxis: { type: "time" } }}
                    />
                }
                {
                    chartMode === "column" && <Column
                        {...
                        {
                            ...chartConfig(flattened, loading),
                            isStack: true,
                            isGroup: true,
                            groupField: 'category',
                            yAxis: {
                                label: {
                                    formatter: (text) => `${Math.round(Number(text) * 100)}%`
                                }
                            }
                        }}
                    />
                }

            </Col>
        </Row>
    </Space>
}