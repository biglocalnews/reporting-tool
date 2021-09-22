import { Column, ColumnConfig } from "@ant-design/charts";
import { Tabs } from "antd";
import {
  GetDataset,
  GetDataset_dataset,
  GetDataset_dataset_records,
} from "../../graphql/__generated__/GetDataset";
import "./DatasetDetailsScoreCard.css";

const { TabPane } = Tabs;

interface ScoreCardProps {
  data: GetDataset | undefined;
  filteredRecords: readonly GetDataset_dataset_records[] | undefined;
  datasetId: string;
}

type ColStat = {
  date: string;
  count: number;
  attribute: string;
  target: number | undefined;
};

const generateColChartConfig = (chartData: Array<ColStat>) => {
  const isBinary =
    Array.from(new Set(chartData.map((e) => e.attribute))).length === 2;
  const config: ColumnConfig = {
    data: chartData,
    xField: "date",
    yField: "count",
    seriesField: "attribute",
    isPercent: true,
    isStack: true,
    yAxis: {
      top: true,
      tickCount: isBinary ? 3 : 0,
      tickLine: null,
      grid: { line: { style: { stroke: "black" } } },
      label: isBinary
        ? {
            formatter: (text) => {
              return text === "0.5"
                ? `${(Number.parseFloat(text) * 100).toFixed(0)}%`
                : null;
            },
          }
        : null,
    },
    label: {
      position: "middle",
      content: function content(item) {
        const labelString = `${(item.count * 100).toFixed(0)}`;
        /*if (item.target) {
          labelString = labelString + ` (${(item.target * 100).toFixed(2)}%)`;
        }*/
        return labelString;
      },
      style: { fill: "#fff" },
    },
  };

  return config;
};

interface Dictionary<T> {
  [Key: string]: T;
}

const barStats = (
  data: GetDataset_dataset,
  records: readonly GetDataset_dataset_records[],
  category: string
) => {
  const chartData: Dictionary<ColStat> = {};
  const lang = window.navigator.language;
  Array.from(records)
    .sort(
      (a, b) => Date.parse(a.publicationDate) - Date.parse(b.publicationDate)
    )
    .forEach((record) => {
      record.entries.forEach((entry) => {
        if (entry.categoryValue.category.name === category && entry.count > 0) {
          const recordDate = new Date(record.publicationDate);

          const monthName = new Intl.DateTimeFormat(lang, {
            month: "long",
          }).format(recordDate);
          const yearMonthCategory = `${monthName}-${recordDate.getFullYear()}-${
            entry.categoryValue.name
          }`;
          const yearMonth = `${monthName} ${recordDate.getFullYear()}`;
          if (!(yearMonthCategory in Object.keys(chartData))) {
            chartData[yearMonthCategory] = {
              date: yearMonth,
              attribute: entry.categoryValue.name,
              count: entry.count,
              target: data.program.targets.find(
                (target) =>
                  target.categoryValue.name === entry.categoryValue.name
              )?.target,
            };
          } else {
            chartData[yearMonthCategory].count += entry.count;
          }
        }
      });
    });
  return Object.values(chartData);
};

const DatasetDetailsScoreCard = ({
  data,
  filteredRecords,
}: ScoreCardProps): JSX.Element | null => {
  const categoryValueNames = (data: GetDataset) =>
    Array.from(
      new Set(
        data.dataset.program.targets.map(
          (target) => target.categoryValue.category.name
        )
      )
    );

  return data?.dataset.program.targets.length && filteredRecords ? (
    <Tabs defaultActiveKey="Gender">
      {categoryValueNames(data).map((category) => (
        <TabPane tab={<span>{category}</span>} key={category}>
          <Column
            {...generateColChartConfig(
              barStats(data.dataset, filteredRecords, category)
            )}
          />
        </TabPane>
      ))}
    </Tabs>
  ) : null;
};

export { DatasetDetailsScoreCard };
