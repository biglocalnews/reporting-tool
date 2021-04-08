import { Button, message, Popconfirm, Space, Table } from "antd";
import React from "react";
import "./DatasetRecordsTable.css";
import { Link } from "react-router-dom";
import {
  GetDataset,
  GetDatasetVariables,
  GetDataset_dataset_records,
} from "../__generated__/GetDataset";
import { useQuery } from "@apollo/react-hooks";
import { GET_DATASET } from "../queries/GetDataset.gql";

const { Column, ColumnGroup } = Table;

interface DatasetRecordsTableProps {
  datasetId: string;
  records: readonly GetDataset_dataset_records[] | undefined;
}

const DatasetRecordsTable = ({
  datasetId,
  records,
}: DatasetRecordsTableProps): JSX.Element => {
  const { data, loading, error } = useQuery<GetDataset, GetDatasetVariables>(
    GET_DATASET,
    {
      variables: { id: datasetId },
    }
  );

  const confirm = (e: any) => {
    message.success("Confirmed!");
  };

  const cancel = (e: any) => {
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
    },
    {
      title: "Women",
      dataIndex: "women",
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
            <Link
              to={{
                pathname: `/dataset/${datasetId}/entry/edit/${recordId}`,
              }}
            >
              Edit
            </Link>

            <Popconfirm
              title="Are you sure to delete this record?"
              onConfirm={confirm}
              onCancel={cancel}
              okText="Yes"
              cancelText="No"
            >
              <Button danger type="text">
                Delete
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const dataSource = records?.map((record) => {
    return record.data.reduce(
      (acc, cur) => ({ ...acc, [cur.categoryValue]: cur.count }),
      { id: record.id, publicationDate: record.publicationDate }
    );
  });

  return (
    <Table
      className="dataset-records-table"
      dataSource={dataSource}
      columns={columns}
      bordered
      size="small"
      scroll={{ x: 1000 }}
      sticky
      title={() => "Summary"}
    />
  );
};

export { DatasetRecordsTable };
