
import { Table } from "antd";
import dayjs from "dayjs";


import {
  GetDataset,
  GetDataset_dataset_records,
} from "../../graphql/__generated__/GetDataset";

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
  datasetData,
  records,
}: DatasetRecordsTableProps): JSX.Element => {


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


  return (
    <Table
      className="dataset-records-table"
      dataSource={tableData}
      bordered
      size="small"
      scroll={{ x: 1000 }}
      sticky
      pagination={{ hideOnSinglePage: true }}

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

    </Table>
  );
};

export { DatasetDetailsRecordsTable };
