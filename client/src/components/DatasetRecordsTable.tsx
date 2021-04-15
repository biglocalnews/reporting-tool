import { Button, message, Popconfirm, Space, Table } from "antd";
import React from "react";
import "./DatasetRecordsTable.css";
import {
  GetDataset,
  GetDatasetVariables,
  GetDataset_dataset_records,
} from "../__generated__/GetDataset";
import { GET_DATASET } from "../queries/GetDataset.gql";
import { useQuery } from "@apollo/client";

interface DatasetRecordsTableProps {
  datasetId: string;
  records: readonly GetDataset_dataset_records[] | undefined;
}

const confirm = () => {
  message.success("Confirmation received");
};

const cancel = () => {
  message.error("Delete cancelled");
};

const columns = [
  {
    title: "Date",
    dataIndex: "publicationDate",
    key: "id",
  },
  {
    title: "Men",
    dataIndex: "men",
    key: "id",
  },
  {
    title: "Women",
    dataIndex: "women",
    key: "id",
  },
  {
    title: "Transgender",
    dataIndex: "transgender",
  },
  {
    title: "Gender Non-Conforming",
    dataIndex: "gender non-conforming",
  },
  {
    title: "Cisgender",
    dataIndex: "cisgender",
  },
  {
    title: "Non-Binary",
    dataIndex: "non-binary",
  },
  {
    dataIndex: "id",
    render: function edit(recordId: number) {
      return (
        <Space>
          <Button type="link" size="small" disabled>
            Edit
          </Button>

          <Popconfirm
            title="Delete this record?"
            onConfirm={confirm}
            onCancel={cancel}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button danger size="small" type="link">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      );
    },
  },
];

const DatasetRecordsTable = ({
  datasetId,
}: DatasetRecordsTableProps): JSX.Element => {
  const { data, loading, error } = useQuery<GetDataset, GetDatasetVariables>(
    GET_DATASET,
    {
      variables: { id: datasetId },
    }
  );

  const dataSource = data?.dataset?.records?.map((record) => {
    return record.data.reduce(
      (acc, cur) => ({ ...acc, [cur.categoryValue]: cur.count }),
      { id: record.id, publicationDate: record.publicationDate }
    );
  });

  // TODO: update for error and loading components
  if (error) return <div>{`Error: ${error.message}`}</div>;

  return (
    <Table
      className="dataset-records-table"
      dataSource={dataSource}
      columns={columns}
      bordered
      size="small"
      scroll={{ x: 1000 }}
      sticky
      title={() => "Records"}
      pagination={{ pageSize: 6 }}
      loading={loading}
    />
  );
};

export { DatasetRecordsTable };