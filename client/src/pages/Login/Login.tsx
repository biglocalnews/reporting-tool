import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Form, Card, Input, Typography, Modal, message } from "antd";
import { RouteComponentProps } from "react-router-dom";
import { Auth } from "../../services/auth";
import * as account from "../../services/account";
import { useAuth } from "../../components/AuthProvider";
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
export type LoginProps = RouteComponentProps;

/**
 * Login UI form.
 */
export const Login = (props: LoginProps) => {
  const auth = useAuth();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [forgotPasswordForm] = Form.useForm<{ email: string }>();
  const [loginForm] = Form.useForm<{ email: string; password: string }>();

  const onFinish = async ({ email, password }: LoginRequest) => {
    setError(null);

    const error = await auth.login(email, password);
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

  /**
   * Request a password reset token.
   */
  const resetPassword = async ({ email }: { email: string }) => {
    setResettingPassword(true);

    try {
      await account.requestPasswordReset(email);
      setShowForgotPassword(false);
      message.success(t("account.resetPassword.reresetSuccess", { email }));
    } catch (e) {
      message.error(
        t("account.resetPassword.reresetError", { message: e.message })
      );
    } finally {
      setResettingPassword(false);
    }
  };

  // Sync the forgot password form with the login form to save user keystrokes.
  forgotPasswordForm.setFieldsValue({
    email: loginForm.getFieldValue("email"),
  });

  return (
    <div className="login">
      <Modal
        forceRender
        visible={showForgotPassword}
        confirmLoading={resettingPassword}
        onCancel={() => {
          forgotPasswordForm.resetFields();
          setShowForgotPassword(false);
        }}
        onOk={() => forgotPasswordForm.submit()}
      >
        <Form form={forgotPasswordForm} onFinish={resetPassword}>
          <Form.Item
            rules={[
              {
                required: true,
                message: t("account.login.enterEmailError"),
              },
            ]}
            label={t("account.login.enterEmailLabel")}
            name="email"
          >
            <Input
              aria-required={true}
              aria-label="e-mail"
              disabled={resettingPassword}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Card className="login-form">
        <Form
          name="login"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          form={loginForm}
          onFinish={onFinish}
        >
          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Text>{t("account.login.prompt")}</Text>
          </Form.Item>
          <Form.Item
            label={t("account.login.enterEmailLabel")}
            name="email"
            rules={[
              {
                required: true,
                message: t("account.login.enterEmailError"),
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
            label={t("account.login.enterPasswordLabel")}
            name="password"
            rules={[
              {
                required: true,
                message: t("account.login.enterPasswordError"),
              },
            ]}
          >
            <Input.Password
              aria-label="password"
              aria-required={true}
              required
            />
          </Form.Item>

          <Form.Item>
            <Button type="link" onClick={() => setShowForgotPassword(true)}>
              {t("account.login.forgotPassword")}
            </Button>
          </Form.Item>
          {error && (
            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
              <Text>Error: {error.message}</Text>
            </Form.Item>
          )}
          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button type="primary" htmlType="submit">
              {t("account.login.action")}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
