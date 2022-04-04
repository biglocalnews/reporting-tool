import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import dayjs from 'dayjs';
import { Button, Card, Col, Divider, List, message, PageHeader, Popconfirm, Row, Select, Space, Statistic, Table, Tooltip } from "antd";
import { WomanOutlined, IdcardOutlined, EyeInvisibleOutlined, MailOutlined, AlertOutlined } from '@ant-design/icons';
import { useTranslation } from "react-i18next";
import { GetAdminStats } from "../../graphql/__generated__/GetAdminStats";
import { AdminStatsInput, NeedsAttentionType, TargetStateType } from "../../graphql/__generated__/globalTypes";
import { GET_ADMIN_STATS } from "../../graphql/__queries__/GetAdminStats";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { cardStyle } from "../Home/Home";
import { SortOrder } from "antd/lib/table/interface";
import { AlignType } from "rc-table/lib/interface";
import { FallOutlined, FileExclamationOutlined, VerticalAlignBottomOutlined } from '@ant-design/icons';
import { ADMIN_GET_TEAM_BY_DATASET_ID } from "../../graphql/__queries__/AdminGetTeamByDatasetId.gql";
import { AdminGetTeamByDatasetId } from "../../graphql/__generated__/AdminGetTeamByDatasetId";
import { ADMIN_GET_TEAMS_BY_DATASET_IDS } from "../../graphql/__queries__/AdminGetTeamsByDatasetIds.gql";
import { AdminGetTeamsByDatasetIds } from "../../graphql/__generated__/AdminGetTeamsByDatasetIds";
import { ADMIN_SEND_EMAIL } from "../../graphql/__mutations__/AdminSendEmail.gql";


interface IDatasetList {
    datasetId: string,
    name: string,
    reportingPeriodEnd: Date,
    key: string
    category?: string,
    percent?: number,
    reportingPeriodName?: string | null | undefined
    count?: number
    needsAttentionTypes?: readonly NeedsAttentionType[]
}

const selectedCardStyle = {
    ...cardStyle,
    border: "1px solid blue",
    boxShadow: "0.2em 0.3em 0.75em rgba(0,0,50,0.3)"
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
    const [getTeam, { loading: teamLoading, }] = useLazyQuery<AdminGetTeamByDatasetId>(ADMIN_GET_TEAM_BY_DATASET_ID);
    const [getTeams, { loading: teamsLoading }] = useLazyQuery<AdminGetTeamsByDatasetIds>(ADMIN_GET_TEAMS_BY_DATASET_IDS);
    const [sendEmail] = useMutation(ADMIN_SEND_EMAIL);


    const [selectedStat, setSelectedStat] = useState("failedTarget");
    const [datasetList, setDatasetList] = useState<IDatasetList[]>();
    const [activeListItem, setActiveListItem] = useState<string>();



    /*const chunker = (a: string[], n: number) => a.reduce((r, v, i) => {
        const c = Math.floor(i / n); // which chunk it belongs to
        (r[c] = r[c] || []).push(v);
        return r
    }, [[] as string[]]);*/

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

    const needsAttentionDatasets = useMemo(() => {
        return adminStats?.adminStats.needsAttention ?? []
    }, [adminStats]);

    const needsAttentionDatasetsListItems = useMemo(() => {
        return needsAttentionDatasets.map(x => ({
            datasetId: x.datasetId,
            name: x.name,
            reportingPeriodEnd: x.reportingPeriodEnd,
            count: x.count,
            needsAttentionTypes: x.needsAttentionTypes,
            key: `${x.datasetId}`
        }));

    }, [needsAttentionDatasets]);


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

        const emailBody = (lastMonth = dayjs().subtract(1, "month"), encoded = true) => {
            let body = "";
            const monthName = lastMonth.format("MMMM");
            let text = [
                `Hi,`,
                `I hope you're well. This is just a gentle reminder that today is the deadline for your ${monthName} 50:50 data.`,
                `We can see you've not yet submitted your figures on the 50:50 Tracker, so please make sure you get your data in and hit the 'PUBLISH' button by 1700gmt today to ensure you're included in this month's stats.`,
                `If you need any help with the Tracker, or have any questions at all, don't hesitate to get in touch.`,
                `We're excited to see how you've done this month. Thank you so much and happy counting!`,
                `All the best,`
            ];
            if (encoded) {
                text = text.map(x => encodeURI(x));
                body = text.join("%0D%0A%0D%0A");
            }
            else {
                body = text.join("\n\n");
            }


            return body;
        }


        const email = (emailAddresses: string[]) => {
            window.location.assign(`mailto:${emailAddresses.join(";")}?subject=Overdue&body=${emailBody()}`);
        }

        const basicColumns = [
            {
                title: t("admin.reports.datasetReportingPeriodEndColumnTitle"),
                dataIndex: "reportingPeriodEnd",
                key: "reportingPeriodEnd",
                sorter: (a: IDatasetList, b: IDatasetList) => new Date(a.reportingPeriodEnd).valueOf() - new Date(b.reportingPeriodEnd).valueOf(),
                sortDirections: ['ascend', 'descend'] as SortOrder[],
                defaultSortOrder: "descend" as SortOrder,
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
            key: "action",
            align: "right" as AlignType,
            render: (_: undefined, record: IDatasetList) => (
                <Space>
                    <Button
                        loading={teamLoading}
                        icon={<MailOutlined />}
                        type="text"
                        onClick={() => getTeam({ variables: { id: record.datasetId } })
                            .then(result => {
                                if (result.data?.teamByDatasetId) {
                                    const team = result.data?.teamByDatasetId;
                                    email(team.users.map(x => x.email));
                                }
                            })
                        }
                    >
                        {t("admin.reports.emailTeam")}
                    </Button>

                </Space>
            )
        };

        const overdueActionsColumn = {
            ...actionsColumn,
            title:
                <Popconfirm
                    title={t("admin.reports.confirmSendEmails")}
                    okText={t("confirm.yes")}
                    cancelText={t("confirm.no")}
                    onConfirm={
                        () => datasetList && getTeams({ variables: { ids: datasetList.map(x => x.datasetId) } })
                            .then(result => {
                                if (result.data?.teamsByDatasetIds) {
                                    const lastMonth = dayjs().subtract(1, "month");
                                    const teams = result.data?.teamsByDatasetIds;
                                    const emailAddresses = Array.from(new Set(teams.flatMap(x => x.users.map(x => x.email))));
                                    sendEmail({
                                        variables: {
                                            input: {
                                                to: emailAddresses,
                                                subject: "Overdue",
                                                body: emailBody(lastMonth, false),
                                                monthYear: lastMonth.format("M YYYY")
                                            }
                                        }
                                    })
                                        .then(result => {
                                            result.data.sendEmail ? message.error(result.data.sendEmail) : message.success(t("admin.reports.sentOk"));
                                        });
                                }
                            })
                    }
                >
                    <Button
                        loading={teamsLoading}
                        icon={<MailOutlined />}
                        type="text"

                    >
                        {t("admin.reports.emailAllOverdue")}
                    </Button>
                </Popconfirm>

        }

        const targetColumns = [{
            title: t("admin.reports.datasetCategoryColumnTitle"),
            dataIndex: "category",
            key: "category",
            sorter: (a: IDatasetList, b: IDatasetList) => (a.category && b.category) ? a.category.localeCompare(b.category) : 0,
            sortDirections: ['ascend', 'descend'] as SortOrder[],
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
            sorter: (a: IDatasetList, b: IDatasetList) => (a.percent && b.percent) ? a.percent - b.percent : 0,
            sortDirections: ['ascend', 'descend'] as SortOrder[],
            render: (percent: number | undefined) => `${percent?.toFixed(2)}%`
        }
        ];

        const iconSize = 30;

        const attentionTypeColumn = {
            title: t("admin.reports.datasetAttentionTypeColumnTitle"),
            dataIndex: "needsAttentionTypes",
            key: "needsAttentionTypes",
            filters: Object.entries(NeedsAttentionType).map(([k,]) => ({ "text": t(`admin.reports.${k}`), "value": k })),
            onFilter: (value: string | number | boolean, record: IDatasetList) =>
                record.needsAttentionTypes ? Object.values(record.needsAttentionTypes).map(x => x as string).includes(NeedsAttentionType[(value as keyof typeof NeedsAttentionType)]) : true,
            render: (needsAttentionTypes: NeedsAttentionType[] | undefined) => <Space>
                {
                    needsAttentionTypes?.map(x => {
                        switch (x) {
                            case NeedsAttentionType.MissedATargetInAllLast3Periods:
                                return <FallOutlined style={{ fontSize: iconSize }} title={t(`admin.reports.${x}`)} />
                            case NeedsAttentionType.MoreThan10PercentBelowATargetLastPeriod:
                                return <VerticalAlignBottomOutlined style={{ fontSize: iconSize }} title={t(`admin.reports.${x}`)} />
                            case NeedsAttentionType.NothingPublishedLast3Periods:
                                return <FileExclamationOutlined style={{ fontSize: iconSize }} title={t(`admin.reports.${x}`)} />
                            default:
                                return <AlertOutlined style={{ fontSize: iconSize }} title="Unknown attention reason" />
                        }
                    })
                }
            </Space>
        }

        if (!datasetList || !datasetList.length) return basicColumns;

        if ("percent" && "category" in datasetList[0]) {
            return [...basicColumns, ...targetColumns];
        }
        else if ("needsAttentionTypes" in datasetList[0]) {
            return [...basicColumns, attentionTypeColumn, actionsColumn];
        }

        return [...basicColumns, overdueActionsColumn];

    }, [t, datasetList, getTeam, getTeams, teamLoading, teamsLoading, sendEmail]);

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
                setDatasetList(needsAttentionDatasetsListItems);
                break;
            default:
                setDatasetList(undefined);
        }
    }, [
        selectedStat,
        setDatasetList,
        failedDatasets,
        goodDatasets,
        overdueDatasetsListItems,
        needsAttentionDatasetsListItems
    ]);

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
                    <Card
                        style={selectedStat === "overdue" ? selectedCardStyle : cardStyle}
                    >
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
                <Tooltip
                    title="Datasets which fulfil one or several of the following criteria:
                            A) Missed any target by any amount below their target for last 3 reporting periods consistently.                
                            OR: B) Anyone 10% or more below target of gender / ethnicity / disability this in last reporting period.                
                            OR: C) Not submitted any data for last 3 reporting periods."
                >
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
                                value={needsAttentionDatasets.length}
                                precision={0}
                                valueStyle={{ color: "red" }}
                            />
                        </Card>
                    </div>
                </Tooltip>
            </Col>
        </Row>
        {
            selectedStat.toLowerCase().indexOf("target") !== -1 &&
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
        }


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
                                    background: activeListItem ? "rgba(0,0,255,0.1)" : "unset"
                                }
                            }}
                        />
                    </List>
                </Col>
            </Row>
        }
    </>
}