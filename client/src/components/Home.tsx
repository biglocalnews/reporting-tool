import React from "react";
import { Tag, Button, Table } from "antd";
import { SearchAutoComplete } from "./SearchAutoComplete";
import { PlusOutlined } from "@ant-design/icons";

const columns: any = [
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
    title: "",
    key: "action",
    render: function btn() {
      return <Button icon={<PlusOutlined />}>Add Data</Button>;
    },
  },
];

const data: any = [
  {
    key: "1",
    team: "BBC News",
    dataset: "Instagram",
    lastUpdated: "12/12/2020",
    tags: ["news", "social media", "instagram"],
  },
  {
    key: "2",
    team: "BBC News",
    dataset: "12pm-4pm",
    lastUpdated: "12/12/2020",
    tags: ["news", "television", "afternoon"],
  },
  {
    key: "3",
    team: "BBC News",
    lastUpdated: "12/12/2020",
    dataset: "Breakfast Hour",
    tags: ["news", "breakfast"],
  },
];

const Home = () => {
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
