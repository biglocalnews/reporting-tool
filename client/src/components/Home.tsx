import React from "react";
import { Tag, Button } from "antd";
import { DatasetsTable } from "./DatasetsTable";
import { SearchAutoComplete } from "./SearchAutoComplete";
import { PlusOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

const Home = () => {
  const data: any = [
    {
      key: "1",
      id: 1,
      team: "BBC News",
      dataset: "Instagram",
      lastUpdated: "12/12/2020",
      tags: ["news", "social media", "instagram"],
    },
    {
      key: "2",
      id: 2,
      team: "BBC News",
      dataset: "12pm-4pm",
      lastUpdated: "12/12/2020",
      tags: ["news", "television", "afternoon"],
    },
    {
      key: "3",
      id: 3,
      team: "BBC News",
      lastUpdated: "12/12/2020",
      dataset: "Breakfast Hour",
      tags: ["news", "breakfast"],
    },
  ];

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
      render: function btn(datasetId: number) {
        return (
          <Link
            to={{
              pathname: `/dataset/${datasetId}`,
            }}
          >
            <Button icon={<PlusOutlined />}>Add Data</Button>
          </Link>
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
      <DatasetsTable data={data} columns={columns} />
    </div>
  );
};

export { Home };
