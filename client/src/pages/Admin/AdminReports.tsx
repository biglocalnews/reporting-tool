import { useQuery } from "@apollo/client";
import { Button, Col, Divider, List, PageHeader, Row, Space, Statistic } from "antd";
import { WomanOutlined, IdcardOutlined, EyeInvisibleOutlined, MailOutlined, AlertOutlined } from '@ant-design/icons';
import { useTranslation } from "react-i18next";
import { GetAdminStats, GetAdminStats_adminStats_targetStates } from "../../graphql/__generated__/GetAdminStats";
import { TargetStateType } from "../../graphql/__generated__/globalTypes";
import { GET_ADMIN_STATS } from "../../graphql/__queries__/GetAdminStats";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";



export const AdminReports = () => {
    const { data: adminStats, loading } = useQuery<GetAdminStats>(GET_ADMIN_STATS);

    const [datasetList, setDatasetList] = useState<GetAdminStats_adminStats_targetStates[]>();

    const failedDatasets = useMemo(() => {
        return adminStats?.adminStats
            .targetStates
            //.filter(x => dayjs(x.date).isAfter(dayjs().subtract(1, 'month')))
            .filter(x => x.state === TargetStateType.fails);
    }, [adminStats]);

    const goodDatasets = useMemo(() => {
        return adminStats?.adminStats
            .targetStates
            //.filter(x => dayjs(x.date).isAfter(dayjs().subtract(1, 'month')))
            .filter(x => x.state === TargetStateType.exceeds);
    }, [adminStats]);

    const allDatasets = useMemo(() => {
        return adminStats?.adminStats
            .targetStates;
    }, [adminStats]);

    const failPercentage = useMemo(() => {
        return failedDatasets && allDatasets ? (failedDatasets.length / allDatasets.length) * 100 : 0;
    }, [failedDatasets, allDatasets]);

    const goodPercentage = useMemo(() => {
        return goodDatasets && allDatasets ? (goodDatasets.length / allDatasets.length) * 100 : 0;
    }, [goodDatasets, allDatasets]);

    const { t } = useTranslation();

    const datasetListItem = (x: GetAdminStats_adminStats_targetStates) =>
        <List.Item
            key={x.id}

            actions={[
                <Space key={"email"}>{<MailOutlined />}{t("admin.reports.emailTeam")}</Space>,
                <Space key={"alert"}>{<AlertOutlined />}{"admin.reports.alertTeam"}</Space>,
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
                })()}{`${x.category} ${x.percent.toFixed(2)}%`}<Link to={`/dataset/${x.id}/details`}>{x.name}</Link>
            </Space>
        </List.Item>

    return <Row>
        <Col span={24}>
            <PageHeader title={t("admin.reports.title")} subTitle={t("admin.reports.subtitle")} />
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
            <Button onClick={() => setDatasetList(failedDatasets)}>Details</Button>
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
            <Button onClick={() => setDatasetList(goodDatasets)}>Details</Button>
        </Col>
        <Col span={24}>
            <Divider />
            <List
                loading={loading}
                dataSource={datasetList}
                renderItem={(x) => datasetListItem(x)}
                itemLayout="vertical"
                size="small"
            />
        </Col>
    </Row>

}