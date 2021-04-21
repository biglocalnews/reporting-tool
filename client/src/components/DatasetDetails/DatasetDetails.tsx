import { Button, Col, Row, Typography } from "antd";
import React from "react";
import { useHistory, useParams } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";
import { DatasetDetailsRecordsTable } from "./DatasetDetailsRecordsTable";
import {
  GetDataset,
  GetDatasetVariables,
} from "../../__generated__/GetDataset";
import { GET_DATASET } from "../../__queries__/GetDataset.gql";
import { useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";

interface RouteParams {
  datasetId: string;
}

const { Text, Title } = Typography;

const DatasetDetails = (): JSX.Element => {
  const { datasetId } = useParams<RouteParams>();
  const history = useHistory();
  const { t } = useTranslation();

  const { data, loading, error } = useQuery<GetDataset, GetDatasetVariables>(
    GET_DATASET,
    {
      variables: { id: datasetId },
    }
  );

  // TODO: update for error and loading components
  if (loading) return <h1>Loading</h1>;
  if (error) return <div>{`Error: ${error.message}`}</div>;

  return (
    <div className="dataset-details_container">
      <Row wrap={false} align="middle">
        <Col flex="none">
          <div>
            <Title style={{ marginBottom: "0px" }} level={2}>
              {data?.dataset?.program.name}
            </Title>
            <Text style={{ fontSize: "large", marginTop: "0px" }}>
              {data?.dataset?.name}
            </Text>
          </div>
        </Col>
        <Col flex="auto">
          <div style={{ float: "right" }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() =>
                history.push(`/dataset/${datasetId}/entry`, {
                  isEditing: false,
                })
              }
            >
              {t("addData")}
            </Button>
          </div>
        </Col>
      </Row>
      <DatasetDetailsRecordsTable
        datasetId={datasetId}
        records={data?.dataset?.records}
      />
    </div>
  );
};

export { DatasetDetails };
