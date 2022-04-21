import { useQuery } from "@apollo/client"
import { Button, Checkbox, Col, Collapse, DatePicker, PageHeader, Row, Space, Statistic, Tag } from "antd";
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
import { LineColumn } from "../Charts/LineColumn";
import { flattenChartData, groupedByMonthYearCategory, groupedByYearCategory } from "../../selectors/ChartData";
import { useAuth } from "../../components/AuthProvider";
import { GET_USER } from "../../graphql/__queries__/GetUser.gql";
import { GetUser, GetUserVariables } from "../../graphql/__generated__/getUser";
import { getPalette } from "../DatasetDetails/DatasetDetails";



const panelStyle = { borderTopLeftRadius: "9px", borderTopRightRadius: "9px" };

export const Reports = () => {
    const userId = useAuth().getUserId();
    const { data: user } = useQuery<GetUser, GetUserVariables>(GET_USER, {
        variables: { id: userId },
    });

    const [filterState, setFilterState] = useState<PublishedRecordSetsInput>({
        categories: [],
        teams: user?.user.teams.map(x => x.name) ?? [],
        tags: [],
        datasetGroups: [],
        year: new Date(Date.now()).getFullYear()
    });



    const { data, loading } = useQuery<GetAllPublishedRecordSets>(GET_ALL_PUBLISHED_RECORD_SETS, {
        variables: {
            //for doing this server side later
            input: {
                categories: [],
                teams: [],
                tags: [],
                datasetGroups: [],
                year: new Date(Date.now()).getFullYear()
            } as PublishedRecordSetsInput
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

    const filteredByDateMinusOne = useMemo(() => {
        return data?.publishedRecordSets
            .filter(x => !filterState.year || filterState.year - 1 === new Date(x.end).getFullYear())
    }, [data, filterState.year]);

    const filteredByDate = useMemo(() => {
        return data?.publishedRecordSets
            .filter(x => !filterState.year || filterState.year === new Date(x.end).getFullYear())
    }, [data, filterState.year]);


    const filteredData = useMemo(() => {
        return [filteredByDate, filteredByDateMinusOne]
            .map((x) => x?.filter(x => !filterState.teams.length || filterState.teams.includes((x.document as IPublishedRecordSetDocument).teamName))
                .filter(x => !filterState.tags.length || (x.document as IPublishedRecordSetDocument).datasetGroupTags.some(y => filterState.tags.includes(y.name)))
                .filter(x => !filterState.datasetGroups.length || filterState.datasetGroups.includes((x.document as IPublishedRecordSetDocument).datasetGroup))
            );
    }, [filteredByDate, filteredByDateMinusOne, filterState.tags, filterState.teams, filterState.datasetGroups]);



    /*const chartData = useMemo(() => {
        return filteredData[0]?.flatMap(x => flattenPublishedDocumentEntries((x.document as IPublishedRecordSetDocument).record)
            .filter(x => !filterState.categories.length || filterState.categories.includes(x.category))
            .map((r) => ({ ...r, date: new Date(x.end) } as IChartData))
        )
    }, [filterState.categories, filteredData]);*/

    const chartData2 = useMemo(() => {
        return groupedByMonthYearCategory(filteredData[0], filterState.categories);
    }, [filterState.categories, filteredData]);

    const flattenedChartData = useMemo(() => { return flattenChartData(chartData2) }, [chartData2]);

    const grouping = useMemo(() => {
        return groupedByYearCategory(filteredData) ?? [[]];
    }, [filteredData])

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
                    <div>
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
                    <div>
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
                    <div>
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
                    <div>
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
                <Row justify="center" gutter={[16, 16]}>
                    {
                        categories
                            .filter(x => !filterState.categories.length || filterState.categories.includes(x))
                            .map((x, i) =>
                                grouping[0] &&
                                filterState.year in grouping[0] &&
                                x in grouping[0][filterState.year] &&
                                <Col span={4} key={i}>

                                    <Pie5050
                                        legend={false}
                                        categoryName={x}
                                        status={grouping[0][filterState.year][x].percent}
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
                                    />
                                    {
                                        grouping[1] &&
                                        filterState.year - 1 in grouping[1] &&
                                        x in grouping[1][filterState.year - 1] &&
                                        <Statistic
                                            value={grouping[0][filterState.year][x].percent - grouping[1][filterState.year - 1][x].percent}
                                            precision={2}
                                            valueStyle={{ color: grouping[0][filterState.year][x].percent - grouping[1][filterState.year - 1][x].percent === 0 ? "grey" : grouping[0][filterState.year][x].percent - grouping[1][filterState.year - 1][x].percent > 0 ? "green" : "red", textAlign: "center" }}
                                            prefix={grouping[0][filterState.year][x].percent - grouping[1][filterState.year - 1][x].percent === 0 ? null : grouping[0][filterState.year][x].percent - grouping[1][filterState.year - 1][x].percent > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                            suffix="%"
                                        />
                                    }

                                </Col>

                            )
                    }
                </Row>
                {
                    <LineColumn
                        data={flattenedChartData}
                        loading={loading}
                        options={{ seriesField: "category" }}
                        columnOptions={{
                            isGroup: true,
                            colorField: "seriesField",
                            color: (e: { category: string }) => getPalette(e.category)[0]
                        }}
                    />
                }

            </Col>


        </Row >
    </Space >
}