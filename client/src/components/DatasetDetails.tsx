import { Button, Col, Row, Typography } from "antd";
import React from "react";
import { Link, useParams } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";
import { DatasetRecordsTable } from "./DatasetRecordsTable";
import { GetDataset, GetDatasetVariables } from "../__generated__/GetDataset";
import { GET_DATASET } from "../queries/GetDataset.gql";
import { useQuery } from "@apollo/client";

interface RouteParams {
  datasetId: string;
}

const { Text, Title } = Typography;

const DatasetDetails = (): JSX.Element => {
  const { datasetId } = useParams<RouteParams>();

  const { data, loading, error } = useQuery<GetDataset, GetDatasetVariables>(
    GET_DATASET,
    {
      variables: { id: datasetId },
    }
  );

  return (
    <div>
      {loading ? (
        <h1>Loading...</h1>
      ) : (
        <div>
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
                <Link
                  to={{
                    pathname: `/dataset/${datasetId}/entry`,
                  }}
                >
                  <Button type="primary" icon={<PlusOutlined />}>
                    Add Data
                  </Button>
                </Link>
              </div>
            </Col>
          </Row>

          <DatasetRecordsTable
            datasetId={datasetId}
            records={data?.dataset?.records}
          />
        </div>
      )}
    </div>
  );
};

export { DatasetDetails };
