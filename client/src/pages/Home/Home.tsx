import { useState } from "react";
import { Tag, Button, Table, Space } from "antd";
import { HomeSearchAutoComplete } from "./HomeSearchAutoComplete";
import { PlusOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { GetUser, GetUserVariables } from "../../graphql/__generated__/getUser";
import { GET_USER } from "../../graphql/__queries__/GetUser.gql";
import { useQuery } from "@apollo/client";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { TFunction, useTranslation } from "react-i18next";
import { useAuth } from "../../components/AuthProvider";
import { ErrorFallback } from "../../components/Error/ErrorFallback";
import { Loading } from "../../components/Loading/Loading";
import { ColumnsType } from "antd/lib/table";

dayjs.extend(localizedFormat);

export interface TableData {
  id: string;
  team: string;
  dataset: string;
  lastUpdated: string;
  tags: Array<string>;
}

const columns: ColumnsType<TableData> = [
  {
    title: "Team",
    dataIndex: "team",
    key: "team",
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
          // TODO: Create component to link tags to datasets with the same tags
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
    render: function btn(datasetId: string) {
      return (
        <Space>
          <Link
            to={{
              pathname: `/dataset/${datasetId}/entry`,
            }}
          >
            <Button type="primary" icon={<PlusOutlined />}>
              Add Data
            </Button>
          </Link>
          <Link
            to={{
              pathname: `/dataset/${datasetId}/details`,
            }}
          >
            <Button icon={<InfoCircleOutlined />}>View Details</Button>
          </Link>
        </Space>
      );
    },
  },
];

const getTableData = (
  queryData: GetUser | undefined,
  t: TFunction<"translation">
) => {
  const rowData: Array<TableData> = [];

  queryData?.user?.teams.map((team) => {
    return team.programs.map((program) => {
      program.datasets.map((dataset) => {
        rowData.push({
          id: dataset.id,
          team: program.name,
          dataset: dataset.name,
          lastUpdated: dataset.lastUpdated
            ? dayjs(dataset.lastUpdated).format("ll")
            : t("noDataAvailable"),
          tags: dataset.tags.map((tag) => {
            return tag.name;
          }),
        });
      });
    });
  });

  return rowData;
};

const Home = (): JSX.Element => {
  const { t } = useTranslation();
  const userId = useAuth().getUserId();

  const { data, loading, error } = useQuery<GetUser, GetUserVariables>(
    GET_USER,
    {
      variables: { id: userId },
    }
  );

  const [filteredData, setFilteredData] = useState<Array<TableData>>([]);

  const rowData = getTableData(data, t);

  // Filters datasets table by search term
  const handleTableSearchFilter = (searchText: string) => {
    const data = [...rowData];
    const filteredData = data.filter(({ team, dataset }) => {
      team = team.toLowerCase();
      dataset = dataset.toLowerCase();
      return team.includes(searchText) || dataset.includes(searchText);
    });

    setFilteredData(filteredData);
  };

  if (error) return <ErrorFallback error={error} />;

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <div>
          <div
            id="home_table-search"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "1rem",
            }}
          >
            <HomeSearchAutoComplete onSearch={handleTableSearchFilter} />
          </div>
          <Table
            dataSource={filteredData.length > 0 ? filteredData : rowData}
            columns={columns}
            rowKey={(dataset) => dataset.id}
            footer={() =>
              filteredData.length > 0
                ? `Showing ${filteredData.length} of ${rowData.length} results`
                : `Showing ${rowData.length} of ${rowData.length} results`
            }
          />
        </div>
      )}
    </>
  );
};

export { Home };
