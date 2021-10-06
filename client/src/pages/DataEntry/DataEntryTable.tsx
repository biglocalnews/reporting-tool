import {
  CheckCircleTwoTone,
  ExclamationCircleTwoTone,
} from "@ant-design/icons";
import { useQuery } from "@apollo/client";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Spin,
  Table,
  Tabs,
} from "antd";
import { FormInstance } from "antd/lib/form";
import moment from "moment";
import PropTypes from "prop-types";
import React, { useContext, useEffect, useRef, useState } from "react";
//import { useTranslation } from "react-i18next";
//import { useParams } from "react-router-dom";
import {
  GetDataset,
  GetDatasetVariables,
} from "../../graphql/__generated__/GetDataset";
//import { UPDATE_RECORD } from "../../graphql/__mutations__/UpdateRecord.gql";
import { GET_DATASET } from "../../graphql/__queries__/GetDataset.gql";
import "./DataEntryTable.css";

/*interface RouteParams {
  datasetId: string;
  recordId?: string;
}*/

//const { datasetId } = useParams<RouteParams>();
const { TabPane } = Tabs;
/*const [updateRecord, { loading: recordSaving }] = useMutation(UPDATE_RECORD, {
  refetchQueries: [
    {
      query: GET_DATASET,
      variables: { id: datasetId },
    },
  ],
});*/

const EditableContext = React.createContext<FormInstance<any> | null>(null);

interface Item {
  key: string;
  date: string;
  cps_number: string;
  story_title: string;
  story_topic: string;
  gender_men: string;
  gender_women: string;
  gender_nb: string;
  disability: string;
  non_disabled: string;
}

interface EditableRowProps {
  index: number;
}

const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
  const [form] = Form.useForm();
  console.log(index);
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

EditableRow.propTypes = {
  index: PropTypes.number.isRequired,
};

interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  children: React.ReactNode;
  inputType: string;
  dataIndex: keyof Item;
  record: Item;
  handleSave: (record: Item) => void;
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
  const inputRef = useRef<any>(null);
  const form = useContext(EditableContext)!;

  useEffect(() => {
    if (editing) {
      inputRef.current!.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      console.log("-> save called", values);
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
        <DatePicker ref={inputRef} format="YYYY-MM-DD" />
      </div>
    ) : inputType === "number" ? (
      <InputNumber ref={inputRef} />
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
        //color={recordSaving ? "red" : "unset"}
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
    key: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    cps_number: PropTypes.string.isRequired,
    story_title: PropTypes.string.isRequired,
    story_topic: PropTypes.string.isRequired,
    gender_men: PropTypes.string.isRequired,
    gender_women: PropTypes.string.isRequired,
    gender_nb: PropTypes.string.isRequired,
    disability: PropTypes.string.isRequired,
    non_disabled: PropTypes.string.isRequired,
  }).isRequired,
};

EditableCell.defaultProps = {
  editable: false,
  inputType: "text",
  title: "",
  record: {
    key: "",
    date: "Some Date",
    cps_number: "1000",
    story_title: "title",
    story_topic: "topic",
    gender_men: "111",
    gender_women: "111",
    gender_nb: "111",
    disability: "50",
    non_disabled: "50",
  },
  children: true,
};

type EditableTableProps = Parameters<typeof Table>[0];

interface DataType {
  key: React.Key;
  date: string;
  cps_number: string;
  story_title: string;
  story_topic: string;
  gender_men: string;
  gender_women: string;
  gender_nb: string;
  disability: string;
  non_disabled: string;
}

interface EditableTableState {
  dataSource: DataType[];
  count: number;
}

type ColumnTypes = Exclude<EditableTableProps["columns"], undefined>;

export const EditableTable: React.FC = () => {
  const { data: queryData, loading: queryLoading } = useQuery<
    GetDataset,
    GetDatasetVariables
  >(GET_DATASET, {
    variables: { id: "96336531-9245-405f-bd28-5b4b12ea3798" },
  });

  console.log(queryData);
  const [tableState, setTableState] = useState<EditableTableState>({
    dataSource: [
      {
        key: "0",
        date: "2021-09-01",
        cps_number: "1234",
        story_title: "Title",
        story_topic: "Topic",
        gender_men: "50",
        gender_women: "48",
        gender_nb: "2",
        disability: "50",
        non_disabled: "50",
      },
      {
        key: "1",
        date: "2021-09-02",
        cps_number: "1235",
        story_title: "Title",
        story_topic: "Topic",
        gender_men: "50",
        gender_women: "48",
        gender_nb: "2",
        disability: "50",
        non_disabled: "50",
      },
    ],
    count: 2,
  });

  const handleDelete = (key: React.Key) => {
    const dataSource = [...tableState.dataSource];
    setTableState((curr) => ({
      ...curr,
      dataSource: dataSource.filter((item) => item.key !== key),
    }));
  };

  const handleAdd = () => {
    const { count } = tableState;
    const dataSource = [...tableState.dataSource];
    const newData: DataType = {
      key: count,
      date: moment().format("YYYY-MM-DD"),
      cps_number: "12346",
      story_title: "Title",
      story_topic: "Topic",
      gender_men: "50",
      gender_women: "48",
      gender_nb: "2",
      disability: "50",
      non_disabled: "50",
    };
    setTableState((curr) => ({
      ...curr,
      ...newData,
      dataSource: [...dataSource, newData],
      count: curr.count + 1,
    }));
  };

  const handleSave = (row: DataType) => {
    //updateRecord();
    const newData = [...tableState.dataSource];
    //const dataSource = [...tableState.dataSource];
    const index = newData.findIndex((item) => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });

    console.log("-> new data save", newData);
    //setTableState((curr) => ({ ...curr, dataSource: { ...newData } }));
    //setTableState((curr) => ({ ...curr, ...newData, dataSource: [...dataSource, newData], count: curr.count }));
  };

  //let columns: (ColumnTypes[number] & { editable?: boolean; dataIndex: string })[];

  const columns = [
    {
      title: "date",
      dataIndex: "date",
      editable: true,
      key: "date",
      dataType: "date",
    },
    {
      title: "CPS No.",
      dataIndex: "cps_number",
      editable: true,
      key: "cps_number",
      dataType: "number",
    },
    {
      title: "Story Title",
      dataIndex: "story_title",
      editable: true,
      key: "story_title",
      dataType: "text",
    },
    {
      title: "Story Topic",
      dataIndex: "story_topic",
      editable: true,
      key: "story_topic",
      dataType: "text",
    },
    {
      title: "Gender",
      dataIndex: "gender",
      key: "gender",
      editable: true,
      

      children: [
        {
          title: "Men",
          dataIndex: "gender_men",
          key: "gender_men",
          editable: true,
          dataType: "number",
        },
        {
          title: "Women",
          dataIndex: "gender_women",
          key: "gender_women",
          editable: true,
          dataType: "number",
        },
        {
          title: "Non Binary",
          dataIndex: "gender_nb",
          key: "gender_nb",
          editable: true,
          dataType: "number",
        },
      ],
    },
    {
      title: "Disability",
      dataIndex: "disability_status",
      key: "disability_status",
      editable: true,
      children: [
        {
          title: "Disabled",
          dataIndex: "disability",
          key: "disability",
          editable: true,
          dataType: "number",
        },
        {
          title: "Non-Disabled",
          dataIndex: "non_disabled",
          key: "non_disabled",
          editable: true,
          dataType: "number",
        },
      ],
    },
    {
      title: "Manage",
      dataIndex: "operation",
      render: function someo(_: any, record: { key: React.Key }) {
        console.log(
          "tableState.dataSource.length",
          tableState.dataSource.length
        );
        return (
          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => handleDelete(record.key)}
          >
            <a href="/">Delete</a>
          </Popconfirm>
        );
      },
    },
  ];

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };
  
  /*const filteredColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: DataType) => ({
        record,
        inputType:
          col.dataIndex === "date"
            ? "date"
            : col.dataIndex === "cps_number"
            ? "number"
            : "text",
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        key: col.key,
        handleSave: handleSave,
      }),
    };
  });*/

  const mapColumns = (col:any) => {
    if (!col.editable) {
      return col;
    }
    const newCol = {
      ...col,
      onCell: (record:any) => ({
        record,
        inputType: col.dataType,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave: handleSave
      })
    };
    if (col.children) {
      newCol.children = col.children.map(mapColumns);
    }
    return newCol;
  };

  const filteredColumns = columns.map(mapColumns);

  return (
    <div className="card-container">
      {!queryLoading ? (
        <>
          <Tabs type="card" size="large">
            <TabPane
              tab={
                <span>
                  <CheckCircleTwoTone twoToneColor="#52c41a" />
                  June
                </span>
              }
              key="1"
            >
              <Table
                components={components}
                rowClassName={() => "editable-row"}
                bordered
                dataSource={tableState.dataSource}
                columns={filteredColumns as ColumnTypes}
              />

              <Button
                onClick={handleAdd}
                type="primary"
                style={{ marginBottom: 16 }}
              >
                Add Row
              </Button>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <CheckCircleTwoTone twoToneColor="#52c41a" />
                  July
                </span>
              }
              key="2"
            >
              <p></p>
            </TabPane>
            <TabPane
              tab={
                <span>
                  <ExclamationCircleTwoTone twoToneColor="#eb2f96" />
                  August
                </span>
              }
              key="3"
            >
              <p></p>
            </TabPane>
          </Tabs>
        </>
      ) : (
        <Spin />
      )}
    </div>
  );
};
