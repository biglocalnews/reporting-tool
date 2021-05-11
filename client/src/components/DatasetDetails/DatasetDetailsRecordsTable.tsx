import { Button, Popconfirm, Space, Table } from "antd";
import React from "react";
import "./DatasetDetailsRecordsTable.css";
import { GetDataset_dataset_records } from "../../__generated__/GetDataset";
import { GET_DATASET } from "../../__queries__/GetDataset.gql";
import { DELETE_RECORD } from "../../__mutations__/DeleteRecord.gql";
import { useTranslation } from "react-i18next";
import { useMutation } from "@apollo/client";
import { useHistory } from "react-router-dom";
import { messageError, messageInfo, messageSuccess } from "../Message";
import dayjs from "dayjs";
import { ColumnsType } from "antd/lib/table/interface";

interface DatasetRecordsTableProps {
  datasetId: string;
  records: readonly GetDataset_dataset_records[] | undefined;
  isLoading: boolean;
}

interface TableData {
  id: string;
  key: string;
  publicationDate: string;
  [key: string]: string;
}

const DatasetDetailsRecordsTable = ({
  datasetId,
  records,
  isLoading,
}: DatasetRecordsTableProps): JSX.Element => {
  const { t } = useTranslation();
  const history = useHistory();

  /*
   * Takes all the entries from a record and sets the
   * category value (e.g. gender) of the entry as a key
   * and its count as the corresponding value to create an
   * array of flat objects.
   */
  const tableData = records?.map((record) => {
    return record.entries.reduce(
      (acc, cur) => ({ ...acc, [cur.categoryValue]: cur.count }),
      {
        id: record.id,
        publicationDate: record.publicationDate,
      }
    );
  }) as TableData[];

  const [
    deleteRecord,
    { loading: deleteRecordLoader, error: deleteRecordError },
  ] = useMutation(DELETE_RECORD, {
    onError: (error) => {
      messageError(`${error.message}. Please try again later.`);
    },
    onCompleted: (deleted) => {
      if (deleted) messageSuccess("Succesfully deleted record!");
    }, // TODO: update cache instead of refetching
    refetchQueries: [
      {
        query: GET_DATASET,
        variables: { id: datasetId },
      },
    ],
  });

  const confirmDelete = (recordId: string) => {
    deleteRecord({ variables: { id: recordId } });
  };

  const cancelDelete = () => {
    messageInfo("Delete cancelled");
  };

  // TODO: render columns dynamically by dataset category types
  const columns: ColumnsType<TableData> = [
    {
      title: "Date",
      dataIndex: "publicationDate",
      key: "id",
      defaultSortOrder: "descend",
      sorter: (dateA: any, dateB: any) =>
        dayjs(dateA.publicationDate).unix() -
        dayjs(dateB.publicationDate).unix(),
      fixed: true,
      width: 100,
      render: (date: string) => dayjs(date).format("YYYY-MM-DD"),
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
      key: "id",
    },
    {
      title: "Gender Non-Conforming",
      dataIndex: "gender non-conforming",
      key: "id",
    },
    {
      title: "Cisgender",
      dataIndex: "cisgender",
      key: "id",
    },
    {
      title: "Non-Binary",
      dataIndex: "non-binary",
      key: "id",
    },
    {
      dataIndex: "id",
      key: "id",
      render: function edit(recordId: string) {
        return (
          <Space>
            <Button
              type="link"
              onClick={() =>
                history.push(`/dataset/${datasetId}/entry/edit/${recordId}`)
              }
            >
              {t("editData")}
            </Button>
            <Popconfirm
              title="Permanently delete this record?"
              onConfirm={() => confirmDelete(recordId)}
              onCancel={cancelDelete}
              okText="Yes, delete"
              okType="danger"
              cancelText="No, cancel"
            >
              <Button id="delete-record" danger size="small" type="link">
                Delete
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      className="dataset-records-table"
      dataSource={tableData}
      columns={columns}
      bordered
      size="small"
      scroll={{ x: 1000 }}
      sticky
      title={() => t("datasetRecordsTableTitle", { title: "Records" })}
      pagination={{ hideOnSinglePage: true }}
      loading={isLoading}
      rowKey={(record) => record.id}
    />
  );
};

export { DatasetDetailsRecordsTable };
