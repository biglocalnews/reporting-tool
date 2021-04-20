import { Button, Result, Typography } from "antd";
import React, { useState } from "react";
import "./DataEntry.css";
import { AggregateDataEntryForm } from "./AggregateDataEntryForm";
import { Link, useHistory, useParams } from "react-router-dom";
import { PersonTypesInput } from "./PersonTypesInput";
import { PlusCircleTwoTone, DashboardTwoTone } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

interface RouteParams {
  datasetId: string;
  recordId?: string;
}

const DataEntry = (): JSX.Element => {
  // TODO: use parameters to manage mutation
  const { datasetId, recordId } = useParams<RouteParams>();
  const location = useHistory();
  const { t } = useTranslation();

  const [submitted, setSubmitted] = useState<boolean>();

  if (submitted)
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
      <PersonTypesInput />
      <AggregateDataEntryForm
        datasetId={datasetId}
        recordId={recordId}
        onFormSubmitted={setSubmitted}
      />
    </>
  );
};

export { DataEntry };
