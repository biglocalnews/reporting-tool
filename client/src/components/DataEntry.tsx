import { Button, Result, Typography } from "antd";
import React from "react";
import "./DataEntry.css";
import { AggregateDataEntryForm } from "./AggregateDataEntryForm";
import { Link, useHistory, useParams } from "react-router-dom";
import { PersonTypesInput } from "./PersonTypesInput";
import { PlusCircleTwoTone, DashboardTwoTone } from "@ant-design/icons";

const { Title } = Typography;

interface RouteParams {
  datasetId: string;
  recordId?: string;
}

const DataEntry = (): JSX.Element => {
  // TODO: use parameters to manage mutation
  const { datasetId, recordId } = useParams<RouteParams>();
  const { push } = useHistory();

  const [submitted, setSubmitted] = React.useState<boolean>();

  if (submitted)
    return (
      <Result
        status="success"
        title="Success!" // TODO: Render dynamically
        subTitle="Data saved for BBC News - Breakfast Hour"
        extra={[
          <Button
            type="primary"
            key="add"
            icon={<PlusCircleTwoTone />}
            onClick={() => push(`/dataset/${datasetId}/entry/reload`)}
          >
            Add More Data
          </Button>,
          <Button
            key="dashboard"
            icon={<DashboardTwoTone />}
            onClick={() => push("/")}
          >
            Go to Dashboard
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
        formSubmitted={setSubmitted}
      />
    </>
  );
};

export { DataEntry };
