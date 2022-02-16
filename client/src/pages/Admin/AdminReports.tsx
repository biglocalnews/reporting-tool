import { useQuery } from "@apollo/client";
import { Button, Col, Divider, List, PageHeader, Row, Select, Space, Statistic } from "antd";
import { WomanOutlined, IdcardOutlined, EyeInvisibleOutlined, MailOutlined, AlertOutlined } from '@ant-design/icons';
import { useTranslation } from "react-i18next";
import { GetAdminStats, GetAdminStats_adminStats_targetStates } from "../../graphql/__generated__/GetAdminStats";
import { AdminStatsInput, TargetStateType } from "../../graphql/__generated__/globalTypes";
import { GET_ADMIN_STATS } from "../../graphql/__queries__/GetAdminStats";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

export const AdminReports = () => {

    const [filterState, setFilterState] = useState<AdminStatsInput>({ duration: 31 });

    const { data: adminStats, loading } = useQuery<GetAdminStats>(GET_ADMIN_STATS,
        {
            variables: {
                input: filterState
            }
        }
    );

    const [datasetList, setDatasetList] = useState<GetAdminStats_adminStats_targetStates[]>();

    const allDatasets = useMemo(() => {
        return adminStats?.adminStats
            .targetStates;
    }, [adminStats]);

    const failedDatasets = useMemo(() => {
        const stf = allDatasets?.filter(x => x.state === TargetStateType.fails);
        return stf;
    }, [allDatasets]);

    const goodDatasets = useMemo(() => {
        return allDatasets?.filter(x => x.state === TargetStateType.exceeds);
    }, [allDatasets]);



    const failPercentage = useMemo(() => {
        return failedDatasets && allDatasets ? (failedDatasets.length / allDatasets.length) * 100 : 0;
    }, [failedDatasets, allDatasets]);

    const goodPercentage = useMemo(() => {
        return goodDatasets && allDatasets ? (goodDatasets.length / allDatasets.length) * 100 : 0;
    }, [goodDatasets, allDatasets]);

    const { t } = useTranslation();

    return <Row gutter={[16, 16]}>
        <Col span={24}>
            <PageHeader title={t("admin.reports.title")} subTitle={t("admin.reports.subtitle")} />
        </Col>
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
        <Col span={24}>
            <Divider orientation="left">{t("admin.reports.statsTitle")}</Divider>
        </Col>
        <Col span={6}>
            <Statistic
                loading={loading}
                title={t("admin.reports.failed")}
                value={failPercentage}
                precision={0}
                valueStyle={{ color: "red" }}
                suffix="%"
            />
            <Button onClick={() => setDatasetList(() => [...(failedDatasets ?? [])])}>Details</Button>
        </Col>
        <Col span={6}>
            <Statistic
                loading={loading}
                title={t("admin.reports.exceeds")}
                value={goodPercentage}
                precision={0}
                valueStyle={{ color: "green" }}
                suffix="%"
            />
            <Button onClick={() => setDatasetList(() => [...(goodDatasets ?? [])])}>Details</Button>
        </Col>
        <Col span={24}>
            <Divider />
            <List
                loading={loading}
                itemLayout="vertical"
                size="small"
            >
                {
                    datasetList?.map((x) =>
                        <List.Item
                            key={`${x.category}-${x.prs_id}-${x.state}`}
                            actions={[
                                <Space key={"email"}>{<MailOutlined />}{t("admin.reports.emailTeam")}</Space>,
                                <Space key={"alert"}>{<AlertOutlined />}{t("admin.reports.alertTeam")}</Space>,
                            ]}
                        >
                            <Space>
                                {(() => {
                                    switch (x.category) {
                                        case "Gender":
                                            return <WomanOutlined />
                                        case "Ethnicity":
                                            return <IdcardOutlined />
                                        case "Disability":
                                            return <EyeInvisibleOutlined />
                                    }
                                })()}{`${x.category} ${x.percent.toFixed(2)}%`}<Link to={`/dataset/${x.dataset_id}/details`}>{x.name}</Link>
                            </Space>
                        </List.Item>)
                }
            </List>
        </Col>
    </Row >

}