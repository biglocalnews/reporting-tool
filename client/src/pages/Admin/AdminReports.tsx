import { useQuery } from "@apollo/client";
import { Col, List, PageHeader, Row, Statistic } from "antd";
import { WomanOutlined, IdcardOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useTranslation } from "react-i18next";
import { GetAdminStats, GetAdminStats_adminStats_targetStates } from "../../graphql/__generated__/GetAdminStats";
import { TargetStateType } from "../../graphql/__generated__/globalTypes";
import { GET_ADMIN_STATS } from "../../graphql/__queries__/GetAdminStats";
//import dayjs from "dayjs";
import { useMemo } from "react";
import { Link } from "react-router-dom";

const datasetListItem = (x: GetAdminStats_adminStats_targetStates) =>
    <List.Item key={x.id}>
        <List.Item.Meta
            avatar={(() => {
                switch (x.category) {
                    case "Gender":
                        return <WomanOutlined />
                    case "Ethnicity":
                        return <IdcardOutlined />
                    case "Disability":
                        return <EyeInvisibleOutlined />
                }
            })()}
            title={x.category}
        />
        <Link to={`/dataset/${x.id}/details`}>{x.name}</Link>
    </List.Item>

export const AdminReports = () => {
    const { data: adminStats, loading } = useQuery<GetAdminStats>(GET_ADMIN_STATS);

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
            <List loading={loading}>
                {
                    failedDatasets?.map(x => datasetListItem(x))
                }
            </List>

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
            <List loading={loading}>
                {
                    goodDatasets?.map(x => datasetListItem(x))
                }
            </List>
        </Col>

    </Row>

}