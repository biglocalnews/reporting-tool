import {
  InfoCircleOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Input, Space, Table, Tag } from "antd";
import {
  ColumnsType,
  FilterConfirmProps,
  FilterDropdownProps,
} from "antd/lib/table/interface";
import { useRef, useState } from "react";
import Highlighter from "react-highlight-words";
import { Link } from "react-router-dom";
import { TableData } from "./Home";

interface TableProps {
  filteredData: TableData[];
  rowData: TableData[];
  loading?: boolean;
}

const HomeDatasetsListTable = ({
  filteredData,
  rowData,
  loading,
}: TableProps): JSX.Element => {
  const searchInputRef = useRef<Input>(null);
  const [searchText, setSearchText] = useState<React.Key>("");
  const [searchedColumn, setSearchedColumn] = useState("");

  const handleSearch = (
    selectedKeys: React.Key[],
    confirm: (param?: FilterConfirmProps) => void,
    dataIndex: string
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: (() => void) | undefined) => {
    if (clearFilters) clearFilters();
    setSearchText("");
  };

  const setFilterIcon = (filtered: boolean) => {
    return (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : "#000000" }} />
    );
  };

  // eslint-disable-next-line react/display-name
  const setFilterDropDown =
    (dataIndex: string) =>
    // eslint-disable-next-line react/display-name
    ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }: FilterDropdownProps) =>
      (
        <div style={{ padding: 8 }}>
          <Input
            ref={searchInputRef}
            placeholder={`Search for a ${dataIndex}`}
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              Search
            </Button>
            <Button
              onClick={() => handleReset(clearFilters)}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      );

  const setOnFilter =
    (dataIndex: string) =>
    (value: string | number | boolean, record: TableData) => {
      return record[dataIndex]
        ? record[dataIndex]
            .toString()
            .toLowerCase()
            .includes(value.toString().toLowerCase())
        : false;
    };

  const setOnFilterDropdownVisibleChange = (visible: boolean) => {
    if (visible) {
      setTimeout(() => searchInputRef.current?.select(), 100);
    }
  };

  // eslint-disable-next-line react/display-name
  const textToHighlight = (dataIndex: string) => (text: string) => {
    return searchedColumn === dataIndex ? (
      <Highlighter
        highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
        searchWords={[searchText.toString()]}
        autoEscape
        textToHighlight={text}
      />
    ) : (
      text
    );
  };

  const columns: ColumnsType<TableData> = [
    {
      title: "Team",
      dataIndex: "team",
      key: "team",
      filterIcon: setFilterIcon,
      filterDropdown: setFilterDropDown("team"),
      onFilter: setOnFilter("team"),
      onFilterDropdownVisibleChange: setOnFilterDropdownVisibleChange,
      render: textToHighlight("team"),
      sortDirections: ["ascend", "descend"],
      sorter: (a, b) => a.team.localeCompare(b.team),
    },
    {
      title: "Dataset",
      dataIndex: "dataset",
      key: "dataset",
      filterIcon: setFilterIcon,
      filterDropdown: setFilterDropDown("dataset"),
      onFilter: setOnFilter("dataset"),
      onFilterDropdownVisibleChange: setOnFilterDropdownVisibleChange,
      render: textToHighlight("dataset"),
      sortDirections: ["ascend", "descend"],
      sorter: (a, b) => a.dataset.localeCompare(b.dataset),
    },
    {
      title: "Last Updated",
      dataIndex: "lastUpdated",
    },
    {
      title: "Tags",
      key: "tags",
      dataIndex: "tags",
      width: 250,
      render: (tags: string[]) => {
        return tags.map((tag: string) => {
          const color = "blue";
          return (
            // TODO: Create component to link tags to datasets with the same tags
            <Tag color={color} key={tag}>
              {tag.toUpperCase()}
            </Tag>
          );
        });
      },
    },
    {
      dataIndex: "id",
      width: 250,
      render: function btn(datasetId: string) {
        return (
          <Space>
            <Link
              to={{
                pathname: `/dataset/${datasetId}/entry`,
              }}
            >
              <Button type="primary" icon={<PlusOutlined />}>
                Add Data
              </Button>
            </Link>
            <Link
              to={{
                pathname: `/dataset/${datasetId}/details`,
              }}
            >
              <Button icon={<InfoCircleOutlined />}>View Details</Button>
            </Link>
          </Space>
        );
      },
    },
  ];

  return (
    <Table<TableData>
      loading={loading}
      dataSource={filteredData.length > 0 ? filteredData : rowData}
      columns={columns}
      rowKey={(dataset) => dataset.id}
      footer={() =>
        filteredData.length > 0
          ? `Showing ${filteredData.length} of ${rowData.length} results`
          : `Showing ${rowData.length} of ${rowData.length} results`
      }
    />
  );
};

export { HomeDatasetsListTable };
