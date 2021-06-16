import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Form, Card, Input, Typography } from "antd";
import { RouteComponentProps } from "react-router-dom";
import { Auth } from "../../services/auth";
import "./Login.css";

const { Text } = Typography;

/**
 * Data passed by the user into a login attempt.
 */
type LoginRequest = {
  email: string;
  password: string;
};

/**
 * Props expected by a login component.
 *
 * Mostly these come from react-router, but the auth component is our custom
 * service that manages authentication.
 */
export type LoginProps = { auth: Auth } & RouteComponentProps;

/**
 * Login UI form.
 */
export const Login = (props: LoginProps) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const onFinish = async ({ email, password }: LoginRequest) => {
    setError(null);

    const error = await props.auth.login(email, password);
    if (error) {
      setError(new Error(error));
    } else {
      const state = props.location.state;
      const redirect = (state && (state as Record<string, any>).from) || {
        pathname: "/",
      };
      props.history.push(redirect);
    }
  };

  const onFinishFailed = (...args: any[]) => {
    console.log("finish failed", args);
  };

  return (
    <div className="login">
      <Card className="login-form">
        <Form
          name="login"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
        >
          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Text>{t("loginPrompt")}</Text>
          </Form.Item>
          <Form.Item
            label={t("enterEmailLabel")}
            name="email"
            rules={[
              {
                required: true,
                message: t("enterEmailError"),
              },
            ]}
          >
            <Input
              type="email"
              aria-label="e-mail"
              aria-required={true}
              required
            />
          </Form.Item>
          <Form.Item
            label={t("enterPasswordLabel")}
            name="password"
            rules={[
              {
                required: true,
                message: t("enterPasswordError"),
              },
            ]}
          >
            <Input.Password
              aria-label="password"
              aria-required={true}
              required
            />
          </Form.Item>
          {error && (
            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
              <Text>Error: {error.message}</Text>
            </Form.Item>
          )}
          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button type="primary" htmlType="submit">
              {t("loginAction")}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
