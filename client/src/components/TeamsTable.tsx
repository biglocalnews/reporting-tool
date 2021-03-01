import React from "react";
import { Table } from "antd";

export default class TeamsTable extends React.Component {
  columns: any = [
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
      responsive: ["md"],
    },
    {
      title: "Tags",
      dataIndex: "tags",
      key: "tags",
      responsive: ["md"],
    },
    {
      title: "Action",
      key: "action",
    },
  ];

  data: any = [
    {
      key: "1",
      team: "BBC News",
      dataset: "Instagram",
      lastUpdated: "1/25/2020",
      tags: ["News ", "Social Media "],
    },
    {
      key: "2",
      team: "BBC News",
      dataset: "Instagram",
      lastUpdated: "1/25/2020",
      tags: ["News ", "Social Media "],
    },
    {
      key: "3",
      team: "BBC News",
      dataset: "Instagram",
      lastUpdated: "1/25/2020",
      tags: ["News ", "Social Media "],
    },
  ];

  render() {
    return <Table columns={this.columns} dataSource={this.data} />;
  }
}
