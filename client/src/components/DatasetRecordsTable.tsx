import { Table, Typography } from "antd";
import React from "react";
import { ColumnsType } from "antd/es/table";
import "./DatasetRecordsTable.css";

const { Column, ColumnGroup } = Table;
const { Text } = Typography;

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
  airdate: string;
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
    airdate: "12/11/2020",
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
    airdate: "12/12/2020",
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

const DatasetRecordsTable = ({
  datasetId,
}: DatasetRecordsProps): JSX.Element => {
  return (
    <Table
      className="dataset-records-table"
      dataSource={data}
      bordered
      size="middle"
      scroll={{ x: 1200 }}
      sticky
      title={() => "Totals"}
    >
      <Column
        title="Air Date"
        dataIndex="airdate"
        key="key"
        responsive={["md"]}
        width="50"
        fixed="left"
      />
      <ColumnGroup title="Gender">
        <Column
          title="Men"
          dataIndex="gender"
          render={(gender: Gender) => {
            return <Text>{gender.men}</Text>;
          }}
        />
        <Column
          title="Women"
          dataIndex="gender"
          render={(gender: Gender) => {
            return <Text>{gender.women}</Text>;
          }}
        />
        <Column
          title="Non-Binary"
          dataIndex="gender"
          render={(gender: Gender) => {
            return <Text>{gender.nonBinary}</Text>;
          }}
        />
      </ColumnGroup>

      <ColumnGroup title="Race">
        <Column
          title="Black"
          dataIndex="race"
          render={(race: Race) => {
            if (typeof race && typeof race.black !== "undefined") {
              return <Text>{race.black}</Text>;
            }
            return 0;
          }}
        />
        <Column
          title="White"
          dataIndex="race"
          render={(race: Race) => {
            if (typeof race && typeof race.white !== "undefined") {
              return <Text>{race.white}</Text>;
            }
            return 0;
          }}
        />
        <Column
          title="Asian"
          dataIndex="race"
          render={(race: Race) => {
            if (typeof race && typeof race.asian !== "undefined") {
              return <Text>{race.asian}</Text>;
            }
            return 0;
          }}
        />
      </ColumnGroup>
      <ColumnGroup title="Ethnicity">
        <Column
          title="Hispanic/Latinx"
          dataIndex="ethnicity"
          render={(ethnicity: Ethnicity) => {
            if (
              typeof ethnicity &&
              typeof ethnicity.hispanicLatinx !== "undefined"
            ) {
              return <Text>{ethnicity.hispanicLatinx}</Text>;
            }
            return 0;
          }}
        />
        <Column
          title="Western European"
          dataIndex="ethnicity"
          render={(ethnicity: Ethnicity) => {
            if (
              typeof ethnicity &&
              typeof ethnicity.westernEuropean !== "undefined"
            ) {
              return <Text>{ethnicity.westernEuropean}</Text>;
            }
            return 0;
          }}
        />
        <Column
          title="Eastern European"
          dataIndex="ethnicity"
          render={(ethnicity: Ethnicity) => {
            if (
              typeof ethnicity &&
              typeof ethnicity.easternEuropean !== "undefined"
            ) {
              return <Text>{ethnicity.easternEuropean}</Text>;
            }
            return 0;
          }}
        />
      </ColumnGroup>
    </Table>
  );
};

export { DatasetRecordsTable };
