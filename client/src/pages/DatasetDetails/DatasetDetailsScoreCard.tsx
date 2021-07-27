import { Pie, PieConfig } from "@ant-design/charts";
import { Card, Col, Row } from "antd";
import _ from "lodash";
import {
  GetDataset,
  GetDataset_dataset_sumOfCategoryValueCounts_categoryValue,
} from "../../graphql/__generated__/GetDataset";
import "./DatasetDetailsScoreCard.css";

interface ScoreCardProps {
  data: GetDataset | undefined;
  datasetId: string;
}

type Attribute = {
  id?: string;
  __typename: string;
  sumOfCounts?: number;
  categoryValue: GetDataset_dataset_sumOfCategoryValueCounts_categoryValue;
  target?: string;
};

type CategoryGroup = {
  category: string;
  attributes: Array<Attribute>;
};

/**
 * Function takes the targets and the sum of the counts for a
 * category value (e.g. non-binary) and groups them by category (e.g. gender)
 * @param data Dataset query result object
 */
const getDatasetStatsByCategory = (data: GetDataset | undefined) => {
  const sumOfCounts = data?.dataset.sumOfCategoryValueCounts;
  const targets = data?.dataset.program.targets;

  const map = new Map();
  sumOfCounts &&
    sumOfCounts?.forEach((item) => map.set(item.categoryValue.id, item));
  targets &&
    targets?.forEach((item) =>
      map.set(item.categoryValue.id, {
        ...map.get(item.categoryValue.id),
        ...item,
      })
    );

  const mergedArr = Array.from(map.values()) as Array<Attribute>;
  const result = _(mergedArr)
    .groupBy((obj) => obj.categoryValue.category.name)
    .map((attributes, category) => ({ category, attributes }))
    .value() as Array<CategoryGroup>;

  return result;
};

/**
 * Function maps the category group data to a type and value object
 * for rendering data in ant design pie chart
 * @param data single category group object with records by category value
 */
const getCategoryGroupChartData = (data: CategoryGroup) => {
  type StatisticDataType = {
    type: string;
    value: number;
  };

  const chart: Array<StatisticDataType> = [];
  data.attributes.map((attribute) =>
    chart.push({
      type: attribute.categoryValue.name,
      value: Number(attribute.sumOfCounts),
    })
  );
  return chart;
};

const generatePieChartConfig = (chartData: CategoryGroup) => {
  const _chartData = getCategoryGroupChartData(chartData);

  const config: PieConfig = {
    appendPadding: 10,
    data: _chartData,
    height: 300,
    angleField: "value",
    colorField: "type",
    radius: 0.75,
    label: {
      type: "inner",
      offset: "-10%",
      content: function content(_ref) {
        const percent = _ref.percent * 100;
        return `${
          percent === 100 || percent === 0 ? percent : percent.toFixed(2)
        }%`;
      },
    },
    legend: {
      offsetX: -15,
    },
    interactions: [{ type: "element-selected" }, { type: "element-active" }],
  };

  return config;
};

const DatasetDetailsScoreCard = ({ data }: ScoreCardProps): JSX.Element => {
  const stats = getDatasetStatsByCategory(data);

  return (
    <Row
      gutter={[16, { xs: 8, sm: 16, md: 24, lg: 32 }]}
      className="dataset-details_statistics"
    >
      {stats.length > 0 &&
        stats.flatMap((category, index) => (
          <Col
            key={index}
            xs={24}
            sm={24}
            md={24 / stats.length} // column numbers based on number of category groups
            lg={24 / stats.length}
            xl={24 / stats.length}
          >
            <Card>
              <Pie {...generatePieChartConfig(category)} />
            </Card>
          </Col>
        ))}
    </Row>
  );
};

export { DatasetDetailsScoreCard };
