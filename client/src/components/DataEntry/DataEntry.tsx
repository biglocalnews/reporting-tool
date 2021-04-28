import { Button, Result, Typography } from "antd";
import React, { useState } from "react";
import "./DataEntry.css";
import { DataEntryAggregateDataEntryForm } from "./DataEntryAggregateDataEntryForm";
import { Link, useHistory, useParams } from "react-router-dom";
import { DataEntryPersonTypesInput } from "./DataEntryPersonTypesInput";
import { PlusCircleTwoTone, DashboardTwoTone } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { ApolloError } from "@apollo/client";

const { Title } = Typography;

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
      <Title style={{ marginBottom: "10px" }} level={2}>
        Add record for{" "}
        <Link
          to={{
            pathname: `/dataset/${datasetId}/details`,
          }}
        >
          {"BBC News - Breakfast Hour"}
        </Link>
      </Title>
      <DataEntryPersonTypesInput />
      <DataEntryAggregateDataEntryForm
        datasetId={datasetId}
        recordId={recordId}
        onFormSubmitted={setFormState}
      />
    </>
  );
};

export { DataEntry };
