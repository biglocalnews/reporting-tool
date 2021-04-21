import { Button, Col, Radio, Result, Row, Typography } from "antd";
import React, { useState } from "react";
import "./DataEntry.css";
import { Link, useHistory, useParams } from "react-router-dom";
import { PersonTypesInput } from "./PersonTypesInput";
import { PlusCircleTwoTone, DashboardTwoTone } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { ApolloError } from "@apollo/client";
import { DataEntryAggregateDataEntryForm } from "./DataEntryAggregateDataEntryForm";

const { Title, Text } = Typography;

interface RouteParams {
  datasetId: string;
  recordId?: string;
}

export interface FormState {
  submitSuccess: boolean | undefined;
  errors?: ApolloError | undefined;
}

const DataEntry = (): JSX.Element => {
  // TODO: use parameters to manage mutation
  const { datasetId, recordId } = useParams<RouteParams>();
  const location = useHistory();
  const { t } = useTranslation();

  const [formState, setFormState] = useState<FormState>();

  console.log("submitted", formState?.submitSuccess);

  if (!formState?.submitSuccess && formState?.errors) {
    return (
      <Result
        title="Oh, no!"
        subTitle={`Sorry, something went wrong. ${formState?.errors?.message}`}
        extra={
          <Button type="primary" onClick={() => location.push("/")}>
            {t("backToDashboard")}
          </Button>
        }
      />
    );
  }

  if (formState?.submitSuccess)
    return (
      <Result
        status="success"
        title="Success!" // TODO: Render dynamically
        subTitle="Data saved for BBC News - Breakfast Hour"
        extra={[
          <Button
            type="primary"
            key="addMoreData"
            icon={<PlusCircleTwoTone />}
            onClick={() => location.push(`/dataset/${datasetId}/entry/reload`)}
          >
            {t("addMoreData")}
          </Button>,
          <Button
            key="goToDataset"
            icon={<DashboardTwoTone />}
            onClick={() => location.push(`/dataset/${datasetId}/details`)}
          >
            {t("goToDataset")}
          </Button>,
        ]}
      />
    );

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
          <DataEntryAggregateDataEntryForm
            datasetId={datasetId}
            onFormSubmitted={setFormState}
          />
        </Col>
      </Row>
    </>
  );
};

export { DataEntry };
