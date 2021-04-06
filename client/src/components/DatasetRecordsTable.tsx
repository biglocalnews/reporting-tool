import { Table } from "antd";
import React from "react";
import "./DatasetRecordsTable.css";
import { Link } from "react-router-dom";

const { Column, ColumnGroup } = Table;

interface DatasetRecordsProps {
  datasetId: string;
}

type Gender = {
  men: number;
  women: number;
  nonBinary: number;
};

// TODO: populate type based on dataset options for race
type Race = {
  black?: number;
  white?: number;
  asian?: number;
};

// TODO: populate type based on dataset options for ethnicity
type Ethnicity = {
  hispanicLatinx?: number;
  westernEuropean?: number;
  easternEuropean?: number;
};

// TODO: populate type based on dataset options for disability
type Disability = {
  visionImpaired?: number;
  hearingImpaired?: number;
};

interface Record {
  key: string;
  id: number;
  publicationDate: string;
  gender: Gender;
  race?: Race;
  ethnicity?: Ethnicity;
  disability?: Disability;
}

// TODO: add gql query to get dataset id records based on user
const data: Record[] = [
  {
    key: "1",
    id: 1,
    publicationDate: "12/11/2020",
    gender: {
      men: 1,
      women: 2,
      nonBinary: 0,
    },
    race: {
      black: 1,
      white: 2,
    },
    ethnicity: {
      easternEuropean: 3,
    },
  },
  {
    key: "2",
    id: 2,
    publicationDate: "12/12/2020",
    gender: {
      men: 1,
      women: 2,
      nonBinary: 0,
    },
    race: {
      black: 1,
      white: 2,
    },
    ethnicity: {
      easternEuropean: 3,
    },
  },
];

const getValueGetter = <T extends { [key: string]: number }>(key: keyof T) => {
  return (record: T | undefined) => {
    if (!record) {
      return 0;
    }

    return record[key] || 0;
  };
};

const DatasetRecordsTable = ({
  datasetId,
}: DatasetRecordsProps): JSX.Element => {
  return (
    <Table
      className="dataset-records-table"
      dataSource={data}
      bordered
      size="small"
      scroll={{ x: 1000 }}
      sticky
      title={() => "Summary"}
    >
      <Column
        title="Date"
        dataIndex="publicationDate"
        key="key"
        width="80"
        fixed="left"
      />
      <ColumnGroup title="Gender">
        <Column title="Men" dataIndex="gender" render={getValueGetter("men")} />
        <Column
          title="Women"
          dataIndex="gender"
          render={getValueGetter("women")}
        />
        <Column
          title="Non-Binary"
          dataIndex="gender"
          render={getValueGetter("nonBinary")}
        />
      </ColumnGroup>

      <ColumnGroup title="Race">
        <Column
          title="Black"
          dataIndex="race"
          render={getValueGetter("black")}
        />
        <Column
          title="White"
          dataIndex="race"
          render={getValueGetter("white")}
        />
        <Column
          title="Asian"
          dataIndex="race"
          render={getValueGetter("asian")}
        />
      </ColumnGroup>
      <ColumnGroup title="Ethnicity">
        <Column
          title="Hispanic/Latinx"
          dataIndex="ethnicity"
          render={getValueGetter("hispanicLatinx")}
        />
        <Column
          title="Western European"
          dataIndex="ethnicity"
          render={getValueGetter("westernEuropean")}
        />
        <Column
          title="Eastern European"
          dataIndex="ethnicity"
          render={getValueGetter("easternEuropean")}
        />
      </ColumnGroup>
      <Column
        dataIndex="id"
        fixed="right"
        width="80"
        render={(recordId: number) => {
          return (
            <Link
              to={{
                pathname: `/add-data/${recordId}`,
              }}
            >
              Edit
            </Link>
          );
        }}
      ></Column>
    </Table>
  );
};

export { DatasetRecordsTable };
