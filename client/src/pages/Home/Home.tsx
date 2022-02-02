import { useQuery } from "@apollo/client";
import { Card, Col, Divider, Row, Skeleton, Statistic } from "antd";
import { useTranslation } from "react-i18next";
import { GetStats } from "../../graphql/__generated__/GetStats";
import { GET_STATS } from "../../graphql/__queries__/GetStats";
import { Typography } from 'antd';
import { getPalette } from "../DatasetDetails/DatasetDetails";
import "./Home.css";
import { Bar } from "@ant-design/charts";

const { Title } = Typography;

const gradientStyle = ({
    backgroundColor: "#f3ec78",
    backgroundImage: `linear-gradient(to right, ${getPalette("Gender")}, ${getPalette("Ethnicity")}, ${getPalette("Disability")})`,
    backgroundSize: "100%",
    backgroundClip: "text",
    "-webkit-background-clip": "text",
    "-moz-background-clip": "text",
    "-webkit-text-fill-color": "transparent",
    "-moz-text-fill-color": "transparent"
})

const cardStyle = ({ border: "3px solid #f0f0f0", borderRadius: "5px", backgroundColor: "#fafafa" });

export const Home = () => {

    const { data: statsData, loading: loadingStats } = useQuery<GetStats>(GET_STATS);
    const { t } = useTranslation();

    return <Row gutter={[16, 16]}>
        <Col span={24} style={{ textAlign: "center" }}>
            <Title level={1} style={{ fontSize: "5rem" }}>
                <Skeleton loading={loadingStats} paragraph={{ rows: 1 }}>
                    {statsData &&
                        <span style={gradientStyle}>
                            {Math.round(statsData.stats.gender)} : {Math.round(statsData.stats.ethnicity)} : {Math.round(statsData.stats.disability)}
                        </span>
                    }
                </Skeleton>
            </Title>
        </Col>
        <Col span={8}>
            <Card style={cardStyle}>
                <Statistic
                    loading={loadingStats}
                    title={t("teams")}
                    value={statsData?.stats.teams}
                />
            </Card>
        </Col>
        <Col span={8}>
            <Card style={cardStyle}>
                <Statistic
                    loading={loadingStats}
                    title={t("datasets")}
                    value={statsData?.stats.datasets}
                />
            </Card>
        </Col>
        <Col span={8}>
            <Card style={cardStyle}>
                <Statistic
                    loading={loadingStats}
                    title={t("tags")}
                    value={statsData?.stats.tags}
                />
            </Card>
        </Col>
        <Col span={12}>
            <Divider orientation="left"><Title level={3}>{t("consistencyChallenge")}</Title></Divider>
        </Col>
        <Col span={12}>
            <Divider orientation="left"><Title level={3}>{t("overview")}</Title></Divider>
        </Col>
        <Col span={12}>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Typography>
                        Teams that feature 50% women contributors for at least three months and to not drop below 45% women contributors in any other month.
                    </Typography>
                </Col>
                {
                    statsData &&
                    <Col span={24}>
                        <Bar
                            data={statsData.stats.consistencies
                                .filter(x => x.category === "Gender")
                                .sort((a, b) => a.year - b.year)}
                            xField="value"
                            yField="year"
                            seriesField="consistencyState"
                            isPercent
                            isStack
                            height={150}
                            width={300}
                            barWidthRatio={1 / 3}
                            color={[getPalette("Gender")[1], "rgba(0,0,0,0)"]}
                            label={{
                                formatter: (v) => Number(v.value) > 0 && v.consistencyState === "consistent" ? `${Math.round(Number(v.value)) * 100}%` : "",

                            }}
                            xAxis={false}
                            legend={false}
                        />
                    </Col>
                }
            </Row>
        </Col>
        <Col span={12}>
            <Typography>
                TBD
            </Typography>
        </Col>

    </Row>
}