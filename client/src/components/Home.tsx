import React from "react";
import { Tag, Button, Table, Space } from "antd";
import { SearchAutoComplete } from "./SearchAutoComplete";
import { PlusOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

const data: any = [
  {
    key: "1",
    id: 1,
    team: "BBC News",
    dataset: "12pm-4pm",
    lastUpdated: "12/19/2020",
    tags: ["news", "television", "afternoon"],
  },
  {
    key: "2",
    id: 2,
    team: "BBC News",
    dataset: "Instagram",
    lastUpdated: "12/12/2020",
    tags: ["news", "social media", "instagram"],
  },
  {
    key: "3",
    id: 3,
    team: "BBC News",
    dataset: "Breakfast Hour",
    lastUpdated: "12/20/2020",
    tags: ["news", "breakfast"],
  },
];

const Home = (): JSX.Element => {
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
      render: function btn(datasetId: number) {
        return (
          <Space>
            <Link
              to={{
                pathname: `/add-data/${datasetId}`,
              }}
            >
              <Button type="primary" icon={<PlusOutlined />}>
                Add Data
              </Button>
            </Link>
            <Link
              to={{
                pathname: `/dataset-details/${datasetId}`,
              }}
            >
              <Button icon={<InfoCircleOutlined />}>View Details</Button>
            </Link>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <SearchAutoComplete
        dataSource={data.map(
          (i: { team: string; dataset: string }) => `${i.team} - ${i.dataset}`
        )}
      />
      <Table dataSource={data} columns={columns} />
    </div>
  );
};

export { Home };
