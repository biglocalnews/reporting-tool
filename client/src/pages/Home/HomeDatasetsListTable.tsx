import { InfoCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Space, Table, Tag } from "antd";
import { ColumnsType } from "antd/lib/table/interface";
import { useState } from "react";
import Highlighter from "react-highlight-words";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { theme } from "../../config";
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

  const highlightTeamName = (text: string) => {
    teamNameFilterText && setSearchText(teamNameFilterText);
    return (
      <Highlighter
        highlightStyle={{ backgroundColor: theme.highlight, padding: 0 }}
        searchWords={[searchText]}
        autoEscape
        textToHighlight={text}
      />
    );
  };

  const renderRowActionButtons = (small: boolean) => (datasetId: string) => {
    return (
      <Space>
        <Link
          to={{
            pathname: `/dataset/${datasetId}/entry`,
          }}
        >
          {small ? (
            <Button type="primary" shape="circle" icon={<PlusOutlined />} />
          ) : (
            <Button type="primary" icon={<PlusOutlined />}>
              {t("addData")}
            </Button>
          )}
        </Link>
        <Link
          to={{
            pathname: `/dataset/${datasetId}/details`,
          }}
        >
          {small ? (
            <Button
              type="primary"
              shape="circle"
              icon={<InfoCircleOutlined />}
            />
          ) : (
            <Button icon={<InfoCircleOutlined />}>{t("viewDetails")}</Button>
          )}
        </Link>
      </Space>
    );
  };

  const renderTags = (tags: string[]) => {
    return tags.map((tag: string) => {
      return (
        <Tag color={theme.primaryBlue} key={tag}>
          {tag.toUpperCase()}
        </Tag>
      );
    });
  };

  const columns: ColumnsType<TableData> = [
    {
      title: `Team & Dataset`,
      key: "teamDataset",
      render: (record) => (
        <>
          {record.team}
          <br />
          {record.dataset}
        </>
      ),
      responsive: ["xs"],
    },
    {
      title: "Actions ",
      key: "actions",
      dataIndex: "id",
      render: renderRowActionButtons(true),
      responsive: ["xs"],
    },
    {
      title: "Team",
      dataIndex: "team",
      key: "team",
      width: 250,
      render: (text: string) =>
        teamNameFilterText ? highlightTeamName(text) : text,
      sortDirections: ["ascend", "descend"],
      sorter: (a, b) => a.team.localeCompare(b.team),
      responsive: ["sm"],
    },
    {
      title: "Dataset",
      dataIndex: "dataset",
      key: "dataset",
      width: 250,
      sortDirections: ["ascend", "descend"],
      sorter: (a, b) => a.dataset.localeCompare(b.dataset),
      responsive: ["sm"],
    },
    {
      title: "Last Updated",
      dataIndex: "lastUpdated",
      responsive: ["sm"],
      width: 250,
    },
    {
      title: "Tags",
      key: "tags",
      dataIndex: "tags",
      width: 250,
      render: renderTags,
      responsive: ["sm"],
    },
    {
      dataIndex: "id",
      width: 280,
      render: renderRowActionButtons(false),
      responsive: ["sm"],
      fixed: "right",
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
      scroll={{ y: 1300 }}
      rowKey={(dataset) => dataset.id}
      footer={() => resultsFoundText}
    />
  );
};

export { HomeDatasetsListTable };
