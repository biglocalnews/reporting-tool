import React from "react";
import { Tag, Button, Table, Space } from "antd";
import { HomeSearchAutoComplete } from "./HomeSearchAutoComplete";
import { PlusOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { GetUser, GetUserVariables } from "../../__generated__/getUser";
import { GET_USER } from "../../__queries__/GetUser.gql";
import { useQuery } from "@apollo/client";
import dayjs from "dayjs";

const columns = [
  {
    title: "Team",
    dataIndex: "team",
    key: "team",
  },
  {
    title: "Dataset",
    dataIndex: "dataset",
    key: "dataset",
  },
  {
    title: "Last Updated",
    dataIndex: "lastUpdated",
    key: "lastUpdated",
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

const getTableData = (queryData: GetUser | undefined) => {
  const rowData: any = [];

  queryData?.user?.teams.map((team) => {
    return team.programs.map((program) => {
      program.datasets.map((dataset) => {
        rowData.push({
          id: dataset.id,
          team: program.name,
          dataset: dataset.name,
          lastUpdated: dayjs(dataset.lastUpdated).format("YYYY-MM-DD"),
          tags: dataset.tags.map((t) => {
            return t.name;
          }),
        });
      });
    });
  });

  return rowData;
};

const Home = (): JSX.Element => {
  const { data, loading, error } = useQuery<GetUser, GetUserVariables>(
    GET_USER,
    {
      variables: { id: "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77" }, // TODO: Replace after user auth implementation
    }
  );

  const rowData = getTableData(data);

  return (
    <div>
      {loading ? (
        <h1>Loading...</h1>
      ) : (
        <div>
          <HomeSearchAutoComplete
            dataSource={rowData.map(
              (i: { team: string; dataset: string }) =>
                `${i.team} - ${i.dataset}`
            )}
          />
          <Table dataSource={rowData} columns={columns} />
        </div>
      )}
    </div>
  );
};

export { Home };
