import { useMutation } from "@apollo/client";
import { Button, Popconfirm, Space, Table } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import {
  messageError,
  messageInfo,
  messageSuccess,
} from "../../components/Message";
import {
  GetDataset,
  GetDataset_dataset_records,
} from "../../graphql/__generated__/GetDataset";
import { DELETE_RECORD } from "../../graphql/__mutations__/DeleteRecord.gql";
import { GET_DATASET } from "../../graphql/__queries__/GetDataset.gql";
import "./DatasetDetailsRecordsTable.css";

interface DatasetRecordsTableProps {
  datasetId: string;
  datasetData: GetDataset | undefined;
  records: readonly GetDataset_dataset_records[] | undefined;
  isLoading: boolean;
}

interface TableData {
  id: string;
  key: string;
  publicationDate: string;
  [key: string]: string | number;
}

const DatasetDetailsRecordsTable = ({
  datasetId,
  datasetData,
  records,
  isLoading,
}: DatasetRecordsTableProps): JSX.Element => {
  const { t } = useTranslation();
  const history = useHistory();

  /*
   * Takes all the entries from a record and sets the
   * category value (e.g. non-binary gender) of the entry as a key
   * and its count as the corresponding value to create an
   * array of flat objects.
   */
  const tableData = records?.map((record) => {
    return record.entries.reduce((accumulator, currentItem) => {
      const catValName = currentItem.categoryValue.name;
      const previousCount = accumulator[catValName] as number | undefined;
      accumulator[catValName] = (previousCount || 0) + currentItem.count;
      accumulator["id"] = record.id;
      accumulator["publicationDate"] = record.publicationDate;
      return accumulator;
    }, {} as TableData);
  });

  const [deleteRecord, { loading: deleteRecordLoader }] = useMutation(
    DELETE_RECORD,
    {
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
    }
  );

  const confirmDelete = (recordId: string) => {
    deleteRecord({ variables: { id: recordId } });
  };

  const cancelDelete = () => {
    messageInfo("Delete cancelled");
  };

  return (
    <Table
      className="dataset-records-table"
      dataSource={tableData}
      bordered
      size="small"
      scroll={{ x: 1000 }}
      sticky
      pagination={{ hideOnSinglePage: true }}
      loading={isLoading || deleteRecordLoader}
      rowKey={(record) => record.id}
    >
      <Table.Column<TableData>
        title="Date"
        dataIndex="publicationDate"
        key="id"
        defaultSortOrder="descend"
        sorter={(dateA: TableData, dateB: TableData) =>
          dayjs(dateA.publicationDate).unix() -
          dayjs(dateB.publicationDate).unix()
        }
        fixed={true}
        width={120}
        render={(date: string) => dayjs(date).format("YYYY-MM-DD")}
      />
      {
        datasetData?.dataset.program.targets
          .flatMap((target) => target.tracks)
          .map(track =>
            <Table.Column<TableData>
              title={track.categoryValue.name}
              dataIndex={track.categoryValue.name}
              key="id"
            />
          )
      }
      <Table.Column<TableData>
        dataIndex="id"
        key="id"
        width={150}
        render={(recordId: string) => {
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
        }}
      />
    </Table>
  );
};

export { DatasetDetailsRecordsTable };
