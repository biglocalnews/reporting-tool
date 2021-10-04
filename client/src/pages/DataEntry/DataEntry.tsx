import { DashboardTwoTone, PlusCircleTwoTone } from "@ant-design/icons";
import { useQuery } from "@apollo/client";
import { Button, Result, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useHistory, useParams } from "react-router-dom";
import {
  GetDataset,
  GetDatasetVariables,
} from "../../graphql/__generated__/GetDataset";
import {
  GetRecord,
  GetRecordVariables,
} from "../../graphql/__generated__/GetRecord";
import { GET_DATASET } from "../../graphql/__queries__/GetDataset.gql";
import { GET_RECORD } from "../../graphql/__queries__/GetRecord.gql";
import "./DataEntry.css";
import { DataEntryAggregateDataEntryForm } from "./DataEntryAggregateDataEntryForm";
import { EditableTable } from "./DataEntryTable";

const { Title } = Typography;

interface RouteParams {
  datasetId: string;
  recordId?: string;
}

const DataEntry = (): JSX.Element => {
  const { t } = useTranslation();

  const { datasetId, recordId } = useParams<RouteParams>();
  const history = useHistory();

  const isEditMode = recordId ? true : false;
  const pageTitle = isEditMode ? "Edit" : "Add";

  const {
    data: datasetData,
    loading: datasetLoading,
    error: datasetError,
  } = useQuery<GetDataset, GetDatasetVariables>(GET_DATASET, {
    variables: { id: datasetId },
  });

  const programAndDatasetPageTitle = `${datasetData?.dataset.program.name} | ${datasetData?.dataset.name}`;

  /* Retrieve a record to populate the data entry form if editing */
  const {
    data: existingRecord,
    called: existingRecordCalled,
    loading: existingRecordLoading,
    error: existingRecordError,
  } = useQuery<GetRecord, GetRecordVariables>(GET_RECORD, {
    variables: { id: recordId! },
    skip: !isEditMode,
  });

  const [isFormSubmittedSuccess, setIsFormSubmittedSuccess] =
    useState<boolean>(false);

  if (isFormSubmittedSuccess)
    return (
      <Result
        status="success"
        title="Success!"
        subTitle={`Data has been saved succesfully for ${programAndDatasetPageTitle}`}
        extra={[
          !isEditMode && (
            <Button
              type="primary"
              key="addMoreData"
              icon={<PlusCircleTwoTone />}
              onClick={() => history.push(`/dataset/${datasetId}/entry/reload`)}
            >
              {t("addMoreData")}
            </Button>
          ),
          <Button
            type={isEditMode ? "primary" : undefined}
            key="goToDataset"
            icon={<DashboardTwoTone />}
            onClick={() => history.push(`/dataset/${datasetId}/details`)}
          >
            {t("goToDataset")}
          </Button>,
        ]}
      />
    );

  if (datasetLoading || (existingRecordCalled && existingRecordLoading))
    return <h1>Loading data...</h1>;
  if (datasetError || (existingRecordCalled && existingRecordError))
    return <h1>Error loading data. Please refresh and try again.</h1>;

  return (
    <>
      <Title style={{ marginBottom: "10px" }} level={2}>
        {`${pageTitle} record for `}
        <Link
          to={{
            pathname: `/dataset/${datasetId}/details`,
          }}
        >
          {` ${programAndDatasetPageTitle}`}
        </Link>
      </Title>
      <EditableTable />
      <DataEntryAggregateDataEntryForm
        datasetData={datasetData}
        datasetId={datasetId}
        recordId={recordId}
        onFormSubmitted={setIsFormSubmittedSuccess}
        existingRecord={existingRecordCalled && existingRecord}
      />
    </>
  );
};

export { DataEntry };
