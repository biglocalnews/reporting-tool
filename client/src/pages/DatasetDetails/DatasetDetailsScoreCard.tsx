import { Column, ColumnConfig } from "@ant-design/charts";
import { Tabs } from "antd";
import moment from "moment";
import { useContext } from "react";
import DatasetDetailsFilterContext, {
  IDatasetDetailsFilter,
} from "../../components/DatasetDetailsFilterProvider";
import {
  GetDataset,
  GetDataset_dataset,
} from "../../graphql/__generated__/GetDataset";
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
  category: string,
  filters: IDatasetDetailsFilter | undefined | null
) => {
  const chartData: Dictionary<ColStat> = {};
  const lang = window.navigator.language;
  let filteredRecords = Array.from(data.records);
  if (filters) {
    if (filters.DateRange && filters.DateRange.length === 2) {
      const from = filters.DateRange[0];
      const to = filters.DateRange[1];
      if (from && to) {
        filteredRecords = filteredRecords.filter(
          (record) =>
            moment(record.publicationDate) >= from &&
            moment(record.publicationDate) <= to
        );
      }
    }
  }
  filteredRecords
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
}: ScoreCardProps): JSX.Element | null => {
  const filterContext = useContext(DatasetDetailsFilterContext);

  return data?.dataset.program.targets.length ? (
    <Tabs defaultActiveKey="Gender">
      {Array.from(
        new Set(
          data.dataset.program.targets.map(
            (target) => target.categoryValue.category.name
          )
        )
      ).map((category) => (
        <TabPane tab={<span>{category}</span>} key={category}>
          <Column
            {...generateColChartConfig(
              barStats(data?.dataset, category, filterContext)
            )}
          />
        </TabPane>
      ))}
    </Tabs>
  ) : null;
};

export { DatasetDetailsScoreCard };
