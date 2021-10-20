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
  personType: string | undefined;
  target: number | undefined;
};

const generateColChartConfig = (chartData: Array<ColStat>) => {
  const config: ColumnConfig = {
    data: chartData,
    xField: "date",
    yField: "count",
    seriesField: "attribute",
    groupField: "personType",
    isGroup: true,
    isPercent: true,
    isStack: true,
    interactions: [{ type: "tooltip", enable: true }],
    yAxis: {
      top: true,
      tickCount: 0,
      tickLine: null,
      grid: { line: { style: { stroke: "black" } } },
    },
    label: {
      position: "middle",
      content: function content(item) {
        const labelString = `${(item.count * 100).toFixed(0)}%`;
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
          const yearMonthCategoryPersonType = `${monthName}-${recordDate.getFullYear()}-${entry.categoryValue.name
            }-${entry.personType ? entry.personType.personTypeName : "Unspecified"
            }`;
          const yearMonth = `${monthName} ${recordDate.getFullYear()}`;
          if (!chartData[yearMonthCategoryPersonType]) {
            chartData[yearMonthCategoryPersonType] = {
              date: yearMonth,
              attribute: entry.categoryValue.name,
              personType: entry.personType
                ? entry.personType.personTypeName
                : "Unspecified",
              count: entry.count,
              target: data.program.targets.find(
                (target) =>
                  target.categoryValue.name === entry.categoryValue.name
              )?.target,
            };
          } else {
            chartData[yearMonthCategoryPersonType].count += entry.count;
          }
        }
      });
    });
  const x = Object.values(chartData);
  return x;
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
