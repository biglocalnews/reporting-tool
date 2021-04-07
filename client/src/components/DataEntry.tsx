import {
  Col,
  Radio,
  Row,
  Typography,
  Button,
  Space,
  message,
  Popconfirm,
} from "antd";
import React from "react";
import "./DataEntry.css";
import { PlusOutlined, DashboardOutlined } from "@ant-design/icons";
import { AggregateDataEntryForm } from "./AggregateDataEntryForm";

const { Text, Title } = Typography;

const personTypeOptions = [
  { label: "BBC Staff", value: "bbc" },
  { label: "Non-BBC", value: "nonBBC" },
  { label: "Public Figures", value: "Orange" },
];

const DataEntry = (): JSX.Element => {
  const confirm = (e: any) => {
    console.log(e);
    message.success("Record has been deleted!");
  };

  const cancel = (e: any) => {
    console.log(e);
    message.error("Delete cancelled");
  };

  return (
    <>
      <Row align="bottom">
        <Col span={12}>
          <Title level={2}>
            Add record for <a href="/">{"BBC News - 12pm-4pm"}</a>
          </Title>
          <Text strong className="data-entry_record_person_type">
            {`This record refers to `}
          </Text>
          <Radio.Group
            options={personTypeOptions}
            optionType="button"
            buttonStyle="solid"
          />
        </Col>
        <Col span={6} offset={6}>
          <form className="publication-date-field">
            <label
              htmlFor="publicationDate"
              style={{ marginBottom: 0, float: "right", textAlign: "right" }}
            >
              <h4>Publication date:</h4>
            </label>
            <input type="date" id="publicationDate" name="publicationDate" />
          </form>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="data-entry">
        <Col span={8}>
          <h3 className="data-entry_category-descr-header">About gender</h3>
          <Text>{`Gender identity expresses one's innermost concept of self as male,
        female, a blend of both or neither - how individuals perceive
        themselves and what they call themselves. Someone's gender identity
        can be the same (cisgender) or different (transgender) from their
        sex assigned at birth.`}</Text>
        </Col>
        <Col span={16}>
          <AggregateDataEntryForm />
          <Row align="middle">
            <Col span={24} style={{ textAlign: "center", marginTop: "20px" }}>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  style={{ whiteSpace: "normal", height: "auto" }}
                >
                  Save and Add New Record
                </Button>
                <Button
                  type="primary"
                  icon={<DashboardOutlined />}
                  style={{ whiteSpace: "normal", height: "auto" }}
                >
                  Save and Return to Dashboard
                </Button>
                <Popconfirm
                  title="Are you sure to delete this record?"
                  onConfirm={confirm}
                  onCancel={cancel}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="primary" danger>
                    Delete Current Record
                  </Button>
                </Popconfirm>
              </Space>
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  );
};

export { DataEntry };
