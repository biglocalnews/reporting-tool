import { Bar } from "@ant-design/charts";
import { useQuery } from "@apollo/client";
import {
  Card,
  Col,
  Divider,
  Radio,
  Row,
  Skeleton,
  Space,
  Statistic,
  Typography,
} from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { GetBasicStats } from "../../graphql/__generated__/GetBasicStats";
import { GetConsistencies } from "../../graphql/__generated__/GetConsistencies";
import { GetHeadlineTotals } from "../../graphql/__generated__/GetHeadlineTotals";
import { GetOverviews } from "../../graphql/__generated__/GetOverviews";
import { GET_BASIC_STATS } from "../../graphql/__queries__/GetBasicStats.gql";
import { GET_CONSISTENCIES } from "../../graphql/__queries__/GetConsistencies";
import { GET_HEADLINE_TOTALS } from "../../graphql/__queries__/GetHeadlineTotals.gql";
import { GET_OVERVIEWS } from "../../graphql/__queries__/GetOverviews";
import { catSort } from "../CatSort";
import { getPalette } from "../DatasetDetails/DatasetDetails";

const { Title } = Typography;

const gradientStyle = (category: string) => ({
  backgroundImage: `linear-gradient(to right, ${getPalette(category).join(
    ","
  )})`,
  backgroundSize: "100%",
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  MozBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  MozTextFillColor: "transparent",
  width: "fit-content",
  fontSize: "5rem",
  textAlign: "center" as const,
  fontWeight: 600,
  margin: "auto",
  lineHeight: 1,
});

export const cardStyle = {
  border: "3px solid #f0f0f0",
  borderRadius: "5px",
  background: "#fafafa",
};

export const Home = () => {
  const { data: basicStats, loading: loadingBasicStats } =
    useQuery<GetBasicStats>(GET_BASIC_STATS);
  const { data: headlineTotals, loading: loadingHeadlineTotals } =
    useQuery<GetHeadlineTotals>(GET_HEADLINE_TOTALS);
  const { data: consistencies, loading: loadingConsistencies } =
    useQuery<GetConsistencies>(GET_CONSISTENCIES);
  const { data: overviews, loading: loadingOverviews } =
    useQuery<GetOverviews>(GET_OVERVIEWS);
  const { t } = useTranslation();
  const [selectedOverviewCategory, setSelectedOverviewCategory] =
    useState("Gender");

  const overviewCategories = useMemo(() => {
    return Array.from(
      new Set(overviews?.overviews.map((x) => x.category))
    ).sort((a, b) => catSort(a, b));
  }, [overviews]);

  const overviewFilters = useMemo(() => {
    return Array.from(new Set(overviews?.overviews.map((x) => x.filter)));
  }, [overviews]);

  const headlineTotal = (
    category: string,
    totals: { percent: number; noOfDatasets: number }
  ) => (
    <Space direction="vertical">
      <div style={gradientStyle(category)}>
        <div>{Math.round(totals.percent)}</div>
      </div>
      <div style={{ color: getPalette(category)[0], fontSize: "0.7rem" }}>
        {`${totals.noOfDatasets} ${t(category)} ${t("datasets")}`}
      </div>
    </Space>
  );

  return (
    <Row gutter={[32, 32]}>
      <Col span={24} style={{ textAlign: "center" }}>
        <Skeleton loading={loadingHeadlineTotals} paragraph={{ rows: 1 }}>
          <Space direction="vertical">
            <Space direction="horizontal" size={50}>
              {headlineTotals &&
                headlineTotals.headlineTotals.gender &&
                headlineTotal("Gender", headlineTotals.headlineTotals.gender)}
              {headlineTotals &&
                headlineTotals.headlineTotals.ethnicity &&
                headlineTotal(
                  "Ethnicity",
                  headlineTotals.headlineTotals.ethnicity
                )}
              {headlineTotals &&
                headlineTotals.headlineTotals.disability &&
                headlineTotal(
                  "Disability",
                  headlineTotals.headlineTotals.disability
                )}
            </Space>
            Figures shown are percentages for the last published record of each
            dataset
          </Space>
        </Skeleton>
      </Col>
      <Col span={8}>
        <Card style={cardStyle}>
          <Statistic
            loading={loadingBasicStats}
            title={t("teams")}
            value={basicStats?.basicStats.teams}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card style={cardStyle}>
          <Statistic
            loading={loadingBasicStats}
            title={t("datasets")}
            value={basicStats?.basicStats.datasets}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card style={cardStyle}>
          <Statistic
            loading={loadingBasicStats}
            title={t("tags")}
            value={basicStats?.basicStats.tags}
          />
        </Card>
      </Col>
      <Col span={12}>
        <Divider orientation="left">
          <Title level={3}>{t("consistencyChallenge")}</Title>
        </Divider>
      </Col>
      <Col span={12}>
        <Divider orientation="left">
          <Title level={3}>{t("overview")}</Title>
        </Divider>
      </Col>
      <Col span={12}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Typography>
              Datasets that meet the Gender target for at least three months and
              do not drop below 45% in any other month.
            </Typography>
          </Col>
          <Col span={24}>
            <Skeleton loading={loadingConsistencies} paragraph={{ rows: 1 }}>
              {consistencies && consistencies.consistencies.length && (
                <Bar
                  data={consistencies.consistencies
                    .filter((x) => x.category === "Gender")
                    .sort((a, b) => a.year - b.year)}
                  xField="value"
                  yField="year"
                  seriesField="consistencyState"
                  isPercent
                  isStack
                  autoFit={false}
                  height={250}
                  barWidthRatio={1 / 2}
                  color={[getPalette("Gender")[0], "rgba(0,0,0,0)"]}
                  label={{
                    formatter: (v) =>
                      Number(v.value) > 0 && v.consistencyState === "consistent"
                        ? `${(Number(v.value) * 100).toFixed(2)}%`
                        : "",
                  }}
                  xAxis={false}
                  legend={false}
                  tooltip={{ showContent: false }}
                />
              )}
            </Skeleton>
          </Col>
        </Row>
      </Col>
      <Col span={12}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Typography>
              Shows the improvement in the proportion of datasets that exceeded
              the target for that category
            </Typography>
          </Col>
          <Col span={24} style={{ textAlign: "center" }}>
            <Radio.Group
              defaultValue={"Gender"}
              onChange={(e) => setSelectedOverviewCategory(e.target.value)}
            >
              {overviewCategories.map((category) => (
                <Radio key={category} value={category}>
                  {category}
                </Radio>
              ))}
            </Radio.Group>
          </Col>
          <Col span={24}>
            <Skeleton loading={loadingOverviews} paragraph={{ rows: 1 }}>
              {overviews &&
                overviews.overviews.length &&
                overviewFilters.map((filter) => (
                  <Card
                    key={`${selectedOverviewCategory + filter}`}
                    title={filter}
                    size="small"
                  >
                    <Bar
                      data={overviews.overviews
                        .filter((x) => x.filter === filter)
                        .filter((x) => x.category === selectedOverviewCategory)
                        .sort((a, b) => b.date.localeCompare(a.date))}
                      xField="value"
                      yField="date"
                      seriesField="targetState"
                      isPercent
                      isStack
                      height={150}
                      width={300}
                      barWidthRatio={1 / 3}
                      label={{
                        formatter: (v) =>
                          Number(v.value) > 0
                            ? `${Math.round(Number(v.value) * 100)}%`
                            : "",
                      }}
                      xAxis={false}
                      yAxis={{
                        label: {
                          formatter: (v) => {
                            switch (v) {
                              case "min":
                                return "First Entry";
                              case "max":
                                return "Last Entry";
                              default:
                                return v;
                            }
                          },
                        },
                      }}
                      legend={{
                        position: "top-right",
                        itemName: {
                          formatter: (v) => {
                            switch (v) {
                              case "exceeds":
                                return "Exceeded";
                              case "lt5":
                                return "Within 5%";
                              case "lt10":
                                return "Within 10%";
                              case "gt10":
                                return "More than 10%";
                              default:
                                return v;
                            }
                          },
                        },
                      }}
                      tooltip={{ showContent: false }}
                    />
                  </Card>
                ))}
            </Skeleton>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};
