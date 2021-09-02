import { Column, ColumnConfig } from "@ant-design/charts";
import { Tabs } from "antd";
import { GetDataset } from "../../graphql/__generated__/GetDataset";
import "./DatasetDetailsScoreCard.css";

const { TabPane } = Tabs;

interface ScoreCardProps {
  data: GetDataset | undefined;
  datasetId: string;
}

type ColStat = {
  date: string;
  count: number;
  attribute: string;
};

const generateColChartConfig = (chartData: Array<ColStat>) => {
  const config: ColumnConfig = {
    data: chartData,
    xField: "date",
    yField: "count",
    seriesField: "attribute",
    isPercent: true,
    isStack: true,
    label: {
      position: "middle",
      content: function content(item) {
        return `${(item.count * 100).toFixed(2)}%`;
      },
      style: { fill: "#fff" },
    },
  };

  return config;
};

const barStats = (data: GetDataset | undefined, category: string) => {
  const chartArray: Array<ColStat> = [];
  data?.dataset.records.forEach((record) =>
    record.entries.forEach((entry) => {
      if (entry.categoryValue.category.name === category && entry.count > 0) {
        chartArray.push({
          date: record.publicationDate.split("T")[0],
          attribute: entry.categoryValue.name,
          count: entry.count,
        });
      }
    })
  );

  return chartArray;
};

const DatasetDetailsScoreCard = ({ data }: ScoreCardProps): JSX.Element => {
  return (
    <Tabs defaultActiveKey="Gender">
      <TabPane tab={<span>Gender</span>} key="Gender">
        <Column {...generateColChartConfig(barStats(data, "Gender"))} />
      </TabPane>
      <TabPane tab={<span>Disability</span>} key="Disability">
        <Column {...generateColChartConfig(barStats(data, "Disability"))} />
      </TabPane>
    </Tabs>
  );
};

export { DatasetDetailsScoreCard };
