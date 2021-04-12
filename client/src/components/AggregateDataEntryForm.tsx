import React, { useState } from "react";
import { Button, Card, Col, Row, Space } from "antd";
import { PlusOutlined, DashboardOutlined } from "@ant-design/icons";
import "./AggregateDataEntryForm.css";

// TODO: gql query this up
const data = [
  {
    id: "1",
    category: "gender",
    categoryValue: "men",
    count: 0,
  },
  { id: "2", category: "gender", categoryValue: "non-binary", count: 0 },
  { id: "3", category: "gender", categoryValue: "women", count: 0 },
  {
    id: "4",
    category: "gender",
    categoryValue: "gender non-conforming",
    count: 0,
  },
  { id: "5", category: "gender", categoryValue: "cisgender", count: 0 },
  { id: "6", category: "gender", categoryValue: "transgender", count: 0 },
];

const AggregateDataEntryForm = (): JSX.Element => {
  // TODO: set state for each entry
  const [inputFields, setInputFields] = useState(data);

  return (
    <>
      <Card type="inner" title="Gender">
        <form>
          {data.map((item, index) => (
            <label key={index} htmlFor={item.categoryValue}>
              <input type="number" id={item.id} placeholder="0" />{" "}
              {item.categoryValue}
            </label>
          ))}
        </form>
      </Card>
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
          </Space>
        </Col>
      </Row>
    </>
  );
};

export { AggregateDataEntryForm };
