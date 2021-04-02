import { Button, Col, Layout, Row } from "antd";
import React from "react";
import { useParams } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";
import { DatasetRecordsTable } from "./DatasetRecordsTable";

interface RouteParams {
  datasetId: string;
}

const ViewDatasetDetails = (): JSX.Element => {
  const params = useParams<RouteParams>();

  return (
    <Layout className="site-layout-background">
      <Row wrap={false} align="middle">
        <Col flex="none">
          <div>
            <h2>Program</h2>
            <h3>Dataset</h3>
          </div>
        </Col>
        <Col flex="auto">
          <div style={{ float: "right" }}>
            <Button type="primary" icon={<PlusOutlined />}>
              Add Data
            </Button>
          </div>
        </Col>
      </Row>

      <DatasetRecordsTable datasetId={params.datasetId} />
    </Layout>
  );
};

export { ViewDatasetDetails };
