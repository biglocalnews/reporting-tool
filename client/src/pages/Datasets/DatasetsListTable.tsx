import { Table } from "antd";

interface TableProps {
  data: [];
  columns: [];
}

const DatasetsListTable = ({ data, columns }: TableProps) => {
  return <Table dataSource={data} columns={columns} />;
};

export { DatasetsListTable };
