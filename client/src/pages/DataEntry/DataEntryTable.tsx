import { useMutation } from "@apollo/client";
import { PlusOutlined, DeleteOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Space, Table, Form, DatePicker, InputNumber, Input, Tabs } from "antd";
import dayjs from "dayjs";
import {
  messageError,
  messageInfo,
  messageSuccess,
} from "../../components/Message";
import {
  GetDataset,
  GetDataset_dataset_records
  
} from "../../graphql/__generated__/GetDataset";
import { DELETE_RECORD } from "../../graphql/__mutations__/DeleteRecord.gql";
//import { UPDATE_RECORD } from "../../graphql/__mutations__/UpdateRecord.gql";
import { GET_DATASET } from "../../graphql/__queries__/GetDataset.gql";
import "./DataEntryTable.css";
import { FormInstance } from "antd/lib/form";
import React, { useContext, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import moment from "moment";

const EditableContext = React.createContext<FormInstance<any> | null>(null);

// =============================================================
// Editable Rows
// =============================================================

/*interface EditableRowProps {
  index: number;
}*/

const EditableRow: React.FC = ({ ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

/*EditableRow.propTypes = {
  index: PropTypes.number.isRequired,
};*/

// =============================================================
// Editable Cells
// =============================================================

interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  children: React.ReactNode;
  inputType: string;
  dataIndex: keyof TableData;
  record: TableData;
  handleSave: (record: TableData) => void;
}

const EditableCell: React.FC<EditableCellProps> = ({
  title,
  editable,
  children,
  inputType,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<Input>(null);
  const inputNumberRef = useRef(null);
  const datePickerRef = useRef(null);
  const form = useContext(EditableContext)!;

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    dataIndex == "publicationDate" ? form.setFieldsValue({ [dataIndex]: moment(record[dataIndex]) }) : form.setFieldsValue({ [dataIndex]: record[dataIndex] });    
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log("Save failed:", errInfo);
    }
  };

  let childNode = children;

  const inputNode =
  inputType === "date" ? (
      <div>
        <DatePicker ref={datePickerRef} format="YYYY-MM-DD" value={moment(record.publicationDate)} />
      </div>
    ) : inputType === "number" ? (
      <InputNumber placeholder="0" min={0} ref={inputNumberRef} onBlur={save}/>
    ) : (
      <Input ref={inputRef} onPressEnter={save} onBlur={save} />
    );

  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{ margin: 0 }}
        name={dataIndex}
        rules={[
          {
            required: true,
            message: `${title} is required.`,
          },
        ]}
      >
        {inputNode}
      </Form.Item>
    ) : (
        <div
        className="editable-cell-value-wrap"
        style={{ paddingRight: 24 }}
        onClick={toggleEdit}
        onKeyDown={toggleEdit}
        role="button"
        tabIndex={0}
        >
          {children}
        </div>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};

EditableCell.propTypes = {
  editable: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  dataIndex: PropTypes.any,
  inputType: PropTypes.oneOf(["text", "number", "date"]).isRequired,
  handleSave: PropTypes.any,
  children: PropTypes.node,
  record: PropTypes.shape({
    id: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
    publicationDate: PropTypes.string.isRequired

  }).isRequired,
};

EditableCell.defaultProps = {
  editable: false,
  inputType: "text",
  title: "",
  record: {
    id: "",
    key: "",
    publicationDate: moment().format("YYYY-MM-DD")
  },
  children: true,
};

const components = {
  body: {
    row: EditableRow,
    cell: EditableCell,
  },
};

type EditableTableProps = Parameters<typeof Table>[0];
type ColumnTypes = Exclude<EditableTableProps["columns"], undefined>;
//var columns: (ColumnTypes[number] & { editable?: boolean; dataIndex: string; id: string })[];

interface EditableTableState {
  dataSource: any[];
  count: number;
}

// =============================================================
// DataEntry Table
// =============================================================

interface DataEntryTableProps {
  datasetId: string;
  datasetData: GetDataset | undefined;
  records: readonly GetDataset_dataset_records[] | undefined;
  isLoading: boolean;
}

interface TableData {
  id: string;
  key: React.Key;
  publicationDate: string;
  [key: string]: string | number;
}

const DataEntryTable = ({
  datasetId,
  datasetData,
  records,
  isLoading,
}: DataEntryTableProps): JSX.Element => {

  /*const [updateRecord] = useMutation(UPDATE_RECORD, {
    refetchQueries: [
      {
        query: GET_DATASET,
        variables: { id: datasetId },
      },
    ],
  });*/


  const tableData = records?.map((record) => {

    return record.entries.reduce((accumulator, currentItem) => {
      const catValName = currentItem.categoryValue.name;
      const previousCount = accumulator[catValName] as number | undefined;
      accumulator[catValName] = (previousCount || 0) + currentItem.count;
      accumulator["id"] = record.id;
      accumulator["key"] = record.id;
      accumulator["dataIndex"] = record.id;
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

  /*const confirmDelete = (recordId: string) => {
    deleteRecord({ variables: { id: recordId } });
  };*/

  const cancelDelete = () => {
    messageInfo("Delete cancelled");
  };

  const handleDelete = (key: React.Key) => {
    const dataSource = [...tableState.dataSource];
    setTableState((curr) => ({
      ...curr,
      dataSource: dataSource.filter((item) => item.key !== key),
    }));

    if(key)
    {
      deleteRecord({ variables: { id: key } });
    }
    else {
      messageSuccess("Succesfully deleted row");
    }
    
  };

  const handleAdd = () => {
    const dataSource = [...tableState.dataSource];
    const newData = {
      id: new Date().valueOf(),
      key: new Date().valueOf(),
      publicationDate: moment().format("YYYY-MM-DD"),
    };

    // Add dynamic elements and default the value to 0
    for (const [key] of Object.entries(dataSource[0])) {
      if(key != "publicationDate" && key != "id" && key != "key")
      {
        Object.defineProperty(newData, `${key}`, {value : 0, writable : true, enumerable : true, configurable : true});
      }
    }
    
    setTableState((curr) => ({
      ...curr,
      ...newData,
      dataSource: [...dataSource, newData],
      count: curr.count + 1,
    }));
  };

  const handleSave = (row:any) => {
    //updateRecord();
    const newData = [...tableState.dataSource];
    const index = newData.findIndex(item => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    setTableState({ dataSource: newData, count: 1 });
  };

  const mapColumns = (col:any) => {
    if (!col.editable) {
      return col;
    }
    const newCol = {
      ...col,
      onCell: (record: TableData) => ({
        record,
        id: col.id,
        key: col.key,
        dataIndex: col.dataIndex,
        title: col.title,
        editable: col.editable,
        inputType: col.inputType,
        handleSave: handleSave
      })
    };
    if (col.children) {
      newCol.children = col.children.map(mapColumns);
    }
    return newCol;
  };

  //console.log('-> dataset ', datasetData?.dataset);

  const categoryGroups = datasetData?.dataset.program.targets.map(item => item.categoryValue.category.name).filter((value, index, self) => self.indexOf(value) === index);
  
  const personTypeArrayFromDataset = datasetData?.dataset.personTypes.map(x => x.personTypeName ?? "Unknown") ?? [];
  const personTypeArrayFromRecords = datasetData?.dataset.records.map(r => r.entries).flat().map(x => x.personType?.personTypeName ?? "Unknown") ?? [];
  
  const mergedPersonTypes = personTypeArrayFromDataset.concat(personTypeArrayFromRecords);
  const personTypeGroups = Array.from(new Set(Array.from(mergedPersonTypes))).sort();

  
  // Build the table columns
  const dateColumn = {
    title: "Date",
    dataIndex: "publicationDate",
    editable: true,
    width: 150,
    inputType: "date",
    fixed: "left",
    defaultSortOrder: "descend",
    render: function fdates(date: string) { return (dayjs(date).format("YYYY-MM-DD") )},
    sorter: function sdates(dateA: TableData, dateB: TableData) { return (dayjs(dateA.publicationDate).unix() - dayjs(dateB.publicationDate).unix())}
  };

  // Loop over people types to create parent columns and add the columns as children
  const dataColumnsTemp = categoryGroups?.map(category => { return (
    {
      title: category,
      dataIndex: category,
      key: category,
      editable: true,
      width: 65,
      //children: categoryGroups?.flatMap(category => category != null ? {title: category, editable: true, width: 90, children: datasetData?.dataset.program.targets.flatMap(item => item.categoryValue.category.name == category ? {title: item.categoryValue.name, dataIndex: item.categoryValue.name, editable: true, width: 100, inputType: "number"} : "") } : "")
      children: datasetData?.dataset.program.targets.flatMap(item => item.categoryValue.category.name == category ? {title: item.categoryValue.name, dataIndex: item.categoryValue.name, editable: true, width: 90, inputType: "number", } : "")
    }
  )});
  
  // This isn't the right way to do this but remove any null values
  const dataColumns = JSON.parse(JSON.stringify(dataColumnsTemp), (key, value) => {
    if (value == null || value == '' || value == [] || value == {})
        return undefined;
    return value;
  });

  // Add column for delete icons
  const manageColumn = {
    title: "",
    fixed: "right",
    width: 15,
    editable: false,
    className: "not-editable",
    dataIndex: "deleteItem",
    key: "deleteItem",

    render: function someo(_: any, record: { key: React.Key }) {
      return (
        <Space>
          <Popconfirm
            title="Permanently delete this record?"
            onCancel={cancelDelete}
            okText="Yes, delete"
            okType="danger"
            cancelText="No, cancel"
            onConfirm={() => handleDelete(record.key)}
          >
            <DeleteOutlined color="red" />
          </Popconfirm>
        </Space>
      );
    },
  };

  const columns = [];
  columns.push(dateColumn);
  Object.values({...dataColumns}).forEach(obj => {
    columns.push(obj);
  });
  columns.push(manageColumn);
  
  const tableColumns = columns.map(mapColumns);
    
  const [tableState, setTableState] = useState<EditableTableState>({
    dataSource: tableData || [{ id: "", key: "", publicationDate: ""}],
    count: 0,
  });
  const { TabPane } = Tabs;

  return (
    <div className="card-container">

        <Tabs defaultActiveKey="1" type="card" tabPosition="top" size="large" style={{ marginTop: 30 }}>

        {personTypeGroups?.map(pane => (
          <TabPane closable={true} tab={pane} key={pane}>
            <Table
              components={components}
              rowClassName={() => 'editable-row'}
              bordered
              dataSource={tableState.dataSource}
              columns={tableColumns as ColumnTypes}
              size="small"
              scroll={{ x: 1800 }}
              sticky
              pagination={{ hideOnSinglePage: true }}
              loading={isLoading || deleteRecordLoader}
            />

            <Button
              onClick={handleAdd}
              type="dashed"
              style={{ marginTop: 15 }}
              icon={<PlusOutlined />}
            >
              Add Row
            </Button>
            <Button
              type="dashed"
              style={{ marginTop: 15, marginLeft: 10 }}
              icon={<SaveOutlined />}
              disabled={true}
            >
              Save Changes
          </Button>
          <Button
              type="dashed"
              style={{ marginTop: 15, marginLeft: 10 }}
              icon={<SaveOutlined />}
              disabled={true}
            >
              Submit Entries
          </Button>
          </TabPane>
        ))}
        </Tabs>
    </div>
  );
};

export { DataEntryTable }