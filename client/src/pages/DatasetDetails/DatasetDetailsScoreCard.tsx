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
  target: number | undefined;
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
        let labelString = `${(item.count * 100).toFixed(2)}%`;
        if (item.target) {
          labelString = labelString + ` (${(item.target * 100).toFixed(2)}%)`;
        }
        return labelString;
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
          target: data.dataset.program.targets.find(
            (target) => target.categoryValue.name === entry.categoryValue.name
          )?.target,
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
      <TabPane tab={<span>Race/Ethnicity</span>} key="Race">
        <Column
          {...generateColChartConfig(barStats(data, "Race / ethnicity"))}
        />
      </TabPane>
    </Tabs>
  );
};

export { DatasetDetailsScoreCard };
