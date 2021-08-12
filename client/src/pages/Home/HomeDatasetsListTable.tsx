import { InfoCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Space, Table, Tag } from "antd";
import { ColumnsType } from "antd/lib/table/interface";
import { useState } from "react";
import Highlighter from "react-highlight-words";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { TableData } from "./Home";

interface TableProps {
  tableData: TableData[];
  totalDatasets: number;
  loading?: boolean;
  teamNameFilterText?: string | null;
}

const HomeDatasetsListTable = ({
  tableData,
  totalDatasets,
  loading,
  teamNameFilterText,
}: TableProps): JSX.Element => {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState<string>("");

  const textToHighlight = (text: string) => {
    if (teamNameFilterText) {
      setSearchText(teamNameFilterText);
      return (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText.toString()]}
          autoEscape
          textToHighlight={text}
        />
      );
    }

    return text;
  };

  const renderRowActionButtons = (datasetId: string) => {
    return (
      <Space>
        <Link
          to={{
            pathname: `/dataset/${datasetId}/entry`,
          }}
        >
          <Button type="primary" icon={<PlusOutlined />}>
            {t("addData")}
          </Button>
        </Link>
        <Link
          to={{
            pathname: `/dataset/${datasetId}/details`,
          }}
        >
          <Button icon={<InfoCircleOutlined />}>{t("viewDetails")}</Button>
        </Link>
      </Space>
    );
  };

  const columns: ColumnsType<TableData> = [
    {
      title: "Team",
      dataIndex: "team",
      key: "team",
      render: textToHighlight,
      sortDirections: ["ascend", "descend"],
      sorter: (a, b) => a.team.localeCompare(b.team),
    },
    {
      title: "Dataset",
      dataIndex: "dataset",
      key: "dataset",
      sortDirections: ["ascend", "descend"],
      sorter: (a, b) => a.dataset.localeCompare(b.dataset),
    },
    {
      title: "Last Updated",
      dataIndex: "lastUpdated",
    },
    {
      title: "Tags",
      key: "tags",
      dataIndex: "tags",
      width: 250,
      render: (tags: string[]) => {
        return tags.map((tag: string) => {
          const color = "blue";
          return (
            <Tag color={color} key={tag}>
              {tag.toUpperCase()}
            </Tag>
          );
        });
      },
    },
    {
      dataIndex: "id",
      width: 250,
      render: renderRowActionButtons,
    },
  ];

  const resultsFoundText =
    tableData.length > 0
      ? t("showingNResults", {
          nResults: tableData.length,
          total: totalDatasets,
        })
      : t("noResultsFound");

  return (
    <Table<TableData>
      loading={loading}
      dataSource={tableData}
      columns={columns}
      rowKey={(dataset) => dataset.id}
      footer={() => resultsFoundText}
    />
  );
};

export { HomeDatasetsListTable };
