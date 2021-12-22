import { Column, ColumnConfig } from "@ant-design/charts";
import { Tabs } from "antd";
import { useTranslation } from "react-i18next";
import {
  GetDataset,
  GetDataset_dataset,
  GetDataset_dataset_program_targets_category,
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



const DatasetDetailsScoreCard = ({
  data,
  filteredRecords,
}: ScoreCardProps): JSX.Element | null => {

  const { t } = useTranslation();

  const barStats = (
    data: GetDataset_dataset,
    records: readonly GetDataset_dataset_records[],
    category: GetDataset_dataset_program_targets_category
  ) => {
    return Object.values(Array.from(records)
      .sort(
        (a, b) => Date.parse(a.publicationDate) - Date.parse(b.publicationDate)
      )
      .reduce((chartData, record) => {
        record.entries
          .filter(x => x.categoryValue.category.id === category.id && x.count > 0)
          .forEach((entry) => {
            const recordDate = new Date(record.publicationDate);
            const monthName = new Intl.DateTimeFormat(window.navigator.language, {
              month: "long",
            }).format(recordDate);
            const yearMonth = `${monthName} ${recordDate.getFullYear()}`;
            const personType = entry.personType ? entry.personType.personTypeName : t("unknownPersonType");
            const yearMonthCategoryPersonType = `${yearMonth}-${entry.categoryValue.name}-${personType}`;

            if (!chartData[yearMonthCategoryPersonType]) {
              chartData[yearMonthCategoryPersonType] = {
                date: yearMonth,
                attribute: entry.categoryValue.name,
                personType: entry.personType
                  ? entry.personType.personTypeName
                  : t("unknownPersonType"),
                count: entry.count,
                target: data.program.targets
                  .find(x => x.category.id === category.id)
                  ?.target,
              };
            } else {
              chartData[yearMonthCategoryPersonType].count += entry.count;
            }
          });
        return chartData;
      }, {} as Dictionary<ColStat>))
  }

  return data?.dataset.program.targets.length && filteredRecords ? (
    <Tabs defaultActiveKey="Gender">
      {
        Array.from(data.dataset.program.targets)
          .sort((a, b) => b.target - a.target)
          .flatMap((target) => target.category)
          .map((category) =>
            <TabPane tab={<span>{category.name}</span>} key={category.id}>
              <Column
                {...generateColChartConfig(
                  barStats(data.dataset, filteredRecords, category)
                )}
              />
            </TabPane>
          )
      }
    </Tabs>
  ) : null;
};

export { DatasetDetailsScoreCard };
