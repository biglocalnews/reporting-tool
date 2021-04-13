import { Col, Radio, Row, Typography, Button, Space } from "antd";
import React, { useState } from "react";
import "./DataEntry.css";
import { AggregateDataEntryForm } from "./AggregateDataEntryForm";
import { useParams } from "react-router-dom";

const { Text, Title } = Typography;

const personTypeOptions = [
  { label: "BBC Staff", value: "bbc" },
  { label: "Non-BBC", value: "nonBBC" },
  { label: "Public Figures", value: "Orange" },
];

interface RouteParams {
  datasetId: string;
  recordId?: string;
}

const DataEntry = (): JSX.Element => {
  // TODO: use parameters to manage mutation
  const { datasetId, recordId } = useParams<RouteParams>();

  return (
    <>
      <Row align="bottom">
        <Col span={12}>
          <Title style={{ marginBottom: "10px" }} level={2}>
            Add record for <a href="/">{"BBC News - 12pm-4pm"}</a>
          </Title>
          <Text className="data-entry_record_person_type">
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
        </Col>
      </Row>
    </>
  );
};

export { DataEntry };
