import { Button, Col, Form, Input, Layout, PageHeader, Row } from "antd";
import { useTranslation } from "react-i18next";

/**
 * Form for first-time app configuration.
 */
export const Configure = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <Row justify="space-between">
        <Col span={12} offset={8}>
          <PageHeader title={t("app.configure")} />
        </Col>
      </Row>
      <Form labelCol={{ span: 8 }} wrapperCol={{ span: 10 }}>
        <Form.Item label={t("app.organization")} name="organization">
          <Input />
        </Form.Item>
        <Form.Item label={t("app.email")} name="email">
          <Input />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 8 }}>
          <Button type="primary" htmlType="submit">
            {t("app.configure")}
          </Button>
        </Form.Item>
      </Form>
    </Layout>
  );
};

export default Configure;
