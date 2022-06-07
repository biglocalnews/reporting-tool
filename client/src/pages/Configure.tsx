import { useMutation } from "@apollo/client";
import {
  Alert,
  Button,
  Col,
  Form,
  Input,
  Layout,
  message,
  PageHeader,
  Row,
  Typography,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useTranslationWithPrefix } from "../components/useTranslationWithPrefix";
import {
  FirstTimeConfigure,
  FirstTimeConfigureVariables,
} from "../graphql/__generated__/FirstTimeConfigure";
import { FIRST_TIME_CONFIGURE } from "../graphql/__mutations__/FirstTimeConfigure.gql";

/**
 * Form for first-time app configuration.
 */
export const Configure = () => {
  const navigate = useNavigate();
  const { t, tp } = useTranslationWithPrefix("app.configure");
  const [configure, { loading, error }] = useMutation<
    FirstTimeConfigure,
    FirstTimeConfigureVariables
  >(FIRST_TIME_CONFIGURE, {
    onCompleted(data) {
      message.success(tp("success"));
      // Redirect to the edit page for the new user. They will be prompted to
      // login before they can see this.
      navigate(`/admin/users/${data.configureApp}`, { replace: true });
      // Using history.go forces the browser to reload auth state, which ensures
      // the "blank slate" mode is fully cleaned up on the frontend.
      navigate(0);
    },
    onError() {
      message.error(tp("error"));
    },
  });

  return (
    <Layout>
      <Row justify="space-between">
        <Col span={10} offset={8}>
          <PageHeader title={tp("title")} />
          <Typography.Paragraph>{tp("description")}</Typography.Paragraph>
          {error && (
            <>
              <Alert
                message={tp("error")}
                description={error.message}
                showIcon
                closable
                type="error"
              />
              <br />
            </>
          )}
        </Col>
      </Row>
      <Form
        onFinish={(values) =>
          configure({
            variables: {
              input: values,
            },
          })
        }
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 10 }}
      >
        <Form.Item
          rules={[
            {
              required: true,
              message: tp("organizationRequired"),
            },
          ]}
          label={tp("organization")}
          name="organization"
        >
          <Input
            placeholder={t("placeholder.organization")}
            aria-required="true"
            aria-label={tp("organization")}
          />
        </Form.Item>
        <Form.Item
          rules={[
            {
              required: true,
              message: tp("firstNameRequired"),
            },
          ]}
          label={tp("firstName")}
          name="firstName"
        >
          <Input
            placeholder={t("placeholder.firstName")}
            aria-required="true"
            aria-label={tp("firstName")}
          />
        </Form.Item>
        <Form.Item
          rules={[
            {
              required: true,
              message: tp("lastNameRequired"),
            },
          ]}
          label={tp("lastName")}
          name="lastName"
        >
          <Input
            placeholder={t("placeholder.lastName")}
            aria-required="true"
            aria-label={tp("lastName")}
          />
        </Form.Item>
        <Form.Item
          rules={[
            { type: "email", message: tp("emailFormat") },
            {
              required: true,
              message: tp("emailRequired"),
            },
          ]}
          label={tp("email")}
          name="email"
        >
          <Input
            placeholder={t("placeholder.email")}
            aria-label={tp("email")}
            aria-required="true"
          />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 8 }}>
          <Button loading={loading} type="primary" htmlType="submit">
            {tp("submit")}
          </Button>
        </Form.Item>
      </Form>
    </Layout>
  );
};

export default Configure;
