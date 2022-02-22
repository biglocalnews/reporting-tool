import { useQuery } from "@apollo/client";
import { Button, Card, Col, Divider, List, PageHeader, Row, Select, Space, Statistic, Table } from "antd";
import { WomanOutlined, IdcardOutlined, EyeInvisibleOutlined, MailOutlined, AlertOutlined } from '@ant-design/icons';
import { useTranslation } from "react-i18next";
import { GetAdminStats } from "../../graphql/__generated__/GetAdminStats";
import { AdminStatsInput, TargetStateType } from "../../graphql/__generated__/globalTypes";
import { GET_ADMIN_STATS } from "../../graphql/__queries__/GetAdminStats";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { cardStyle } from "../Home/Home";
import { SortOrder } from "antd/lib/table/interface";
import { AlignType } from "rc-table/lib/interface";


interface IDatasetList {
    datasetId: string,
    name: string,
    reportingPeriodEnd: Date,
    key: string
    category?: string,
    percent?: number,
    reportingPeriodName?: string | null | undefined
}

const selectedCardStyle = {
    ...cardStyle,
    border: "2px solid green",
    boxShadow: "0.2em 0.3em 0.75em rgba(0,50,0,0.3)"
}

export const AdminReports = () => {

    const [filterState, setFilterState] = useState<AdminStatsInput>({ duration: 31 });

    const [selectedStat, setSelectedStat] = useState("failedTarget");

    const { data: adminStats, loading } = useQuery<GetAdminStats>(GET_ADMIN_STATS,
        {
            variables: {
                input: filterState
            }
        }
    );

    const [datasetList, setDatasetList] = useState<IDatasetList[]>();
    const [activeListItem, setActiveListItem] = useState<string>();

    const overdueDatasets = useMemo(() => {
        return adminStats?.adminStats.overdue ?? []
    }, [adminStats]);

    const overdueDatasetsListItems = useMemo(() => {
        return overdueDatasets.map(x => ({
            datasetId: x.datasetId,
            name: x.name,
            reportingPeriodEnd: x.reportingPeriodEnd,
            reportingPeriodName: x.reportingPeriodName,
            key: `${x.datasetId}-${x.reportingPeriodEnd}`
        }));

    }, [overdueDatasets]);


    const allDatasets = useMemo(() => {
        return adminStats?.adminStats
            .targetStates;
    }, [adminStats]);

    const failedDatasets = useMemo(() => {
        return allDatasets?.filter(x => x.state === TargetStateType.fails)
            .map(x => ({
                datasetId: x.datasetId,
                name: x.name,
                reportingPeriodEnd: x.reportingPeriodEnd,
                reportingPeriodName: undefined,
                percent: x.percent,
                category: x.category,
                key: `${x.category}-${x.prsId}-${x.state}`
            }));

    }, [allDatasets]);

    const goodDatasets = useMemo(() => {
        return allDatasets?.filter(x => x.state === TargetStateType.exceeds).map(x => ({
            datasetId: x.datasetId,
            name: x.name,
            reportingPeriodEnd: x.reportingPeriodEnd,
            reportingPeriodName: undefined,
            percent: x.percent,
            category: x.category,
            key: `${x.category}-${x.prsId}-${x.state}`
        }));
    }, [allDatasets]);

    const failPercentage = useMemo(() => {
        return failedDatasets && allDatasets ? (failedDatasets.length / allDatasets.length) * 100 : 0;
    }, [failedDatasets, allDatasets]);

    const goodPercentage = useMemo(() => {
        return goodDatasets && allDatasets ? (goodDatasets.length / allDatasets.length) * 100 : 0;
    }, [goodDatasets, allDatasets]);

    const { t } = useTranslation();


    const dataListBaseColumns = useMemo(() => {
        const basicColumns = [
            {
                title: t("admin.reports.datasetReportingPeriodEndColumnTitle"),
                dataIndex: "reportingPeriodEnd",
                key: "reportingPeriodEnd",
                sorter: (a: IDatasetList, b: IDatasetList) => a.reportingPeriodEnd.valueOf() - b.reportingPeriodEnd.valueOf(),
                sortDirections: ['ascend', 'descend'] as SortOrder[],
                render: (rpe: Date) => new Date(rpe).toLocaleString(navigator.language, { day: "2-digit", month: "short", year: "numeric" } as Intl.DateTimeFormatOptions)
            },
            {
                title: t("admin.reports.datasetNameColumnTitle"),
                dataIndex: "name",
                key: "name",
                sorter: (a: IDatasetList, b: IDatasetList) => a.name.localeCompare(b.name),
                sortDirections: ['ascend', 'descend'] as SortOrder[],
                render: (name: string, record: IDatasetList) => <Link to={`/dataset/${record.datasetId}/details`}>{name}</Link>
            }
        ];

        const actionsColumn = {
            title: "",
            key: "action",
            align: "right" as AlignType,
            render: () => (
                <Space>
                    <MailOutlined /><Button type="text">{t("admin.reports.emailTeam")}</Button>
                    <AlertOutlined /><Button type="text">{t("admin.reports.alertTeam")}</Button>
                </Space>
            )
        };

        const targetColumns = [{
            title: t("admin.reports.datasetCategoryColumnTitle"),
            dataIndex: "category",
            key: "category",
            render: (category: string, record: IDatasetList) => <Space>
                {(() => {
                    switch (record.category) {
                        case "Gender":
                            return <WomanOutlined />
                        case "Ethnicity":
                            return <IdcardOutlined />
                        case "Disability":
                            return <EyeInvisibleOutlined />
                    }
                })()}{`${category}`}
            </Space>
        },
        {
            title: t("admin.reports.datasetPercentColumnTitle"),
            dataIndex: "percent",
            key: "percent",
            render: (percent: number | undefined) => `${percent?.toFixed(2)}%`
        }
        ];

        if (!datasetList || !datasetList.length) return basicColumns;

        return "percent" && "category" in datasetList[0] ? [...basicColumns, ...targetColumns, actionsColumn] : [...basicColumns, actionsColumn];

    }, [t, datasetList]);

    useEffect(() => {
        switch (selectedStat) {
            case "failedTarget":
                setDatasetList(failedDatasets);
                break;
            case "exceededTarget":
                setDatasetList(goodDatasets);
                break;
            case "overdue":
                setDatasetList(overdueDatasetsListItems);
                break;
            case "needsAttention":
                setDatasetList(overdueDatasetsListItems);
                break;
            default:
                setDatasetList(undefined);
        }
    }, [selectedStat, setDatasetList, failedDatasets, goodDatasets, overdueDatasetsListItems]);

    return <>
        <PageHeader title={t("admin.reports.title")} subTitle={t("admin.reports.subtitle")} />
        <Row gutter={[16, 16]}>
            <Col span={6}>
                <div
                    role="button"
                    tabIndex={0}
                    style={{ cursor: "pointer" }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { setSelectedStat("failedTarget") } }}
                    onClick={() => setSelectedStat("failedTarget")}
                >
                    <Card style={selectedStat === "failedTarget" ? selectedCardStyle : cardStyle}>
                        <Statistic
                            loading={loading}
                            title={t("admin.reports.failed")}
                            value={failPercentage}
                            precision={0}
                            valueStyle={{ color: "red" }}
                            suffix="%"
                        />

                    </Card>
                </div>
            </Col>
            <Col span={6}>
                <div
                    role="button"
                    tabIndex={0}
                    style={{ cursor: "pointer" }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { setSelectedStat("exceededTarget") } }}
                    onClick={() => setSelectedStat("exceededTarget")}
                >
                    <Card style={selectedStat === "exceededTarget" ? selectedCardStyle : cardStyle}>
                        <Statistic
                            loading={loading}
                            title={t("admin.reports.exceeds")}
                            value={goodPercentage}
                            precision={0}
                            valueStyle={{ color: "green" }}
                            suffix="%"
                        />
                    </Card>
                </div>
            </Col>
            <Col span={6}>
                <div
                    role="button"
                    tabIndex={0}
                    style={{ cursor: "pointer" }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { setSelectedStat("overdue") } }}
                    onClick={() => setSelectedStat("overdue")}
                >
                    <Card style={selectedStat === "overdue" ? selectedCardStyle : cardStyle}>
                        <Statistic
                            loading={loading}
                            title={t("admin.reports.overdueStatTitle")}
                            value={overdueDatasets.length}
                            precision={0}
                            valueStyle={{ color: "red" }}
                        />
                    </Card>
                </div>
            </Col>
            <Col span={6}>
                <div
                    role="button"
                    tabIndex={0}
                    style={{ cursor: "pointer" }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { setSelectedStat("needsAttention") } }}
                    onClick={() => setSelectedStat("needsAttention")}
                >
                    <Card style={selectedStat === "needsAttention" ? selectedCardStyle : cardStyle}>
                        <Statistic
                            loading={loading}
                            title={t("admin.reports.reqAttentionStatTitle")}
                            value={1 / 0}
                            precision={0}
                            valueStyle={{ color: "green" }}
                            suffix="%"
                        />
                    </Card>
                </div>
            </Col>
        </Row>
        <Row justify="center">
            <Col span={24}>
                <Divider orientation="left">{t("admin.reports.filtersTitle")}</Divider>
            </Col>
            <Col span={24}>
                <Space>
                    {t("admin.reports.selectDays")}
                    <Select
                        value={filterState.duration}
                        onChange={(e) => setFilterState((curr) => ({ ...curr, duration: e }))}
                    >
                        <Select.Option value={31}>31</Select.Option>
                        <Select.Option value={62}>62</Select.Option>
                        <Select.Option value={93}>93</Select.Option>
                    </Select>
                </Space>
            </Col>

        </Row >

        {
            datasetList &&

            <Row justify="center">
                <Col span={24}>
                    <Divider orientation="left">{t("admin.reports.dataTitle")}</Divider>
                    <List
                        loading={loading}
                        itemLayout="horizontal"
                        size="small"

                    >
                        <Table
                            columns={dataListBaseColumns}
                            dataSource={datasetList}
                            onRow={(record) => {
                                return {
                                    onMouseEnter: () => setActiveListItem(record.key),
                                    onMouseLeave: () => setActiveListItem(undefined),
                                    onClick: () => setActiveListItem((curr) => curr ? undefined : record.key),
                                    backgroundColor: activeListItem ? "cyan" : "unset"
                                }
                            }}
                        />
                    </List>
                </Col>
            </Row>
        }
    </>
}