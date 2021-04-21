import React from "react";
import { Table } from "antd";

interface TableProps {
  data: [];
  columns: [];
}

const HomeDatasetsListTable = ({ data, columns }: TableProps) => {
  return <Table dataSource={data} columns={columns} />;
};

export { HomeDatasetsListTable };
