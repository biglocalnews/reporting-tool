import { useQuery } from "@apollo/client";
import { Button, Card, Col, Divider, List, PageHeader, Row, Select, Space, Statistic } from "antd";
import { WomanOutlined, IdcardOutlined, EyeInvisibleOutlined, MailOutlined, AlertOutlined } from '@ant-design/icons';
import { useTranslation } from "react-i18next";
import { GetAdminStats } from "../../graphql/__generated__/GetAdminStats";
import { AdminStatsInput, TargetStateType } from "../../graphql/__generated__/globalTypes";
import { GET_ADMIN_STATS } from "../../graphql/__queries__/GetAdminStats";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { cardStyle } from "../Home/Home";


interface IListItem {
    datasetId: string,
    name: string,
    reportingPeriodEnd: Date
}

interface ITargetItem extends IListItem {
    category: string,
    percent: number
}

interface IOverdueItem extends IListItem {
    reportingPeriodName: string | null | undefined
}

interface IDatasetList {
    datasetId: string,
    name: string,
    reportingPeriodEnd: Date,
    key: string
    render(): JSX.Element
}

export const AdminReports = () => {

    const [filterState, setFilterState] = useState<AdminStatsInput>({ duration: 31 });

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
            key: `${x.datasetId}`,
            render: () => renderOverdueListItem(x)
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
                key: `${x.category}-${x.prsId}-${x.state}`,
                render: () => renderListItem(x)
            }));

    }, [allDatasets]);

    const goodDatasets = useMemo(() => {
        return allDatasets?.filter(x => x.state === TargetStateType.exceeds).map(x => ({
            datasetId: x.datasetId,
            name: x.name,
            reportingPeriodEnd: x.reportingPeriodEnd,
            reportingPeriodName: undefined,
            key: `${x.category}-${x.prsId}-${x.state}`,
            render: () => renderListItem(x)
        }));
    }, [allDatasets]);

    const failPercentage = useMemo(() => {
        return failedDatasets && allDatasets ? (failedDatasets.length / allDatasets.length) * 100 : 0;
    }, [failedDatasets, allDatasets]);

    const goodPercentage = useMemo(() => {
        return goodDatasets && allDatasets ? (goodDatasets.length / allDatasets.length) * 100 : 0;
    }, [goodDatasets, allDatasets]);

    const { t } = useTranslation();

    const renderListItem = (x: ITargetItem): JSX.Element => <>
        {(() => {
            switch (x.category) {
                case "Gender":
                    return <WomanOutlined />
                case "Ethnicity":
                    return <IdcardOutlined />
                case "Disability":
                    return <EyeInvisibleOutlined />
            }
        })()}{`${x.category} ${x.percent.toFixed(2)}%`}<Link to={`/dataset/${x.datasetId}/details`}>{x.name}</Link>
    </>

    const dateFormatOptions: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };

    const renderOverdueListItem = (x: IOverdueItem): JSX.Element => <>
        {
            `Due ${new Date(x.reportingPeriodEnd).toLocaleString(navigator.language, dateFormatOptions)}`
        }
        <Link to={`/dataset/${x.datasetId}/details`}>{x.name}</Link>
    </>


    return <>
        <PageHeader title={t("admin.reports.title")} subTitle={t("admin.reports.subtitle")} />
        <Row gutter={[16, 16]}>
            <Col span={6}>
                <div
                    role="button"
                    tabIndex={0}
                    style={{ cursor: "pointer" }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { setDatasetList(goodDatasets) } }}
                    onClick={() => setDatasetList(failedDatasets)}
                >
                    <Card style={cardStyle}>
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
                    onKeyDown={(e) => { if (e.key === 'Enter') { setDatasetList(goodDatasets) } }}
                    onClick={() => setDatasetList(goodDatasets)}
                >
                    <Card style={cardStyle}>
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
                    onKeyDown={(e) => { if (e.key === 'Enter') { setDatasetList(overdueDatasetsListItems) } }}
                    onClick={() => setDatasetList(overdueDatasetsListItems)}

                >
                    <Card style={cardStyle}>
                        <Statistic
                            loading={loading}
                            title={t("admin.reports.reqAttentionStatTitle")}
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
                    onKeyDown={(e) => { if (e.key === 'Enter') { setDatasetList(undefined) } }}
                    onClick={() => setDatasetList(undefined)}
                >
                    <Card style={cardStyle}>
                        <Statistic
                            loading={loading}
                            title={t("admin.reports.reqImprovementStatTitle")}
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
                        {
                            datasetList?.map((x) => {
                                return <List.Item
                                    key={x.key}
                                    actions={[
                                        <Space key={"email"} style={{ visibility: activeListItem === x.key ? "visible" : "hidden" }}>
                                            <MailOutlined /><Button type="text">{t("admin.reports.emailTeam")}</Button>
                                        </Space>,
                                        <Space key={"alert"} style={{ visibility: activeListItem === x.key ? "visible" : "hidden" }}>
                                            <AlertOutlined /><Button type="text">{t("admin.reports.alertTeam")}</Button>
                                        </Space>,
                                    ]}
                                    onMouseEnter={() => setActiveListItem(x.key)}
                                    onMouseLeave={() => setActiveListItem(undefined)}
                                    onClick={() => setActiveListItem((curr) => curr ? undefined : x.key)}

                                >
                                    <Space>
                                        {
                                            x.render()
                                        }
                                    </Space>
                                </List.Item>
                            })
                        }
                    </List>
                </Col>
            </Row>
        }
    </>
}