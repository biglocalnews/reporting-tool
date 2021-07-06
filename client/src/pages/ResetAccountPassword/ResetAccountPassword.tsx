import React, { useState } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHeader, Card, Form, Input, Alert, Button, message } from "antd";
import { Loading } from "../../components/Loading/Loading";
import * as account from "../../services/account";
import "./ResetAccountPassword.css";

/**
 * Form to reset a password, provided they pass a valid token.
 */
export const ResetAccountPassword = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const [resetError, setResetError] = useState<Error | null>(null);
  const [resetting, setResetting] = useState(false);

  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");
  const email = queryParams.get("email");

  // The user can't resubmit the form if there was a critical error; they'll
  // have to go through the entire flow again.
  const canSubmit =
    !resetError || resetError.message === "REGISTER_INVALID_PASSWORD";

  /**
   * Try to go through the password reset flow again.
   */
  const resetAgain = async () => {
    try {
      if (!email) {
        throw new Error("missing email");
      }
      await account.requestPasswordReset(email);
      message.success(t("account.resetPassword.reresetSuccess", { email }));
    } catch (e) {
      message.error(
        t("account.resetPassword.reresetError", { message: e.message })
      );
    }
  };

  /**
   * Update the user's password with the new one provided.
   */
  const saveNewPassword = async ({ password }: { password: string }) => {
    if (!canSubmit) {
      return;
    }
    setResetting(true);
    setResetError(null);
    try {
      if (!token) {
        throw new Error("MISSING_TOKEN");
      }
      await account.resetPassword({ token, password });
      message.success(t("account.resetPassword.success"));
      history.push("/");
    } catch (e) {
      setResetError(e);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="reset-password">
      <Card className="reset-password-form">
        {resetError && (
          <>
            <Alert
              type="error"
              message={t("account.resetPassword.error")}
              description={t(
                `account.resetPassword.errors.${resetError.message}`
              )}
              showIcon
              action={
                !canSubmit && (
                  <Button type="primary" danger onClick={resetAgain}>
                    {t("account.resetPassword.action")}
                  </Button>
                )
              }
            />
            <br />
          </>
        )}
        <Form onFinish={saveNewPassword}>
          <PageHeader
            title={t("account.resetPassword.title")}
            subTitle={t("account.resetPassword.subtitle")}
          />
          <Form.Item
            label={t("account.resetPassword.newPasswordLabel")}
            rules={[
              {
                required: true,
                message: t("account.resetPassword.missingPassword"),
              },
            ]}
            name="password"
          >
            <Input.Password
              aria-required="true"
              aria-label={t("account.resetPassword.newPasswordLabel")}
              disabled={!canSubmit}
            />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button htmlType="submit" type="primary" disabled={!canSubmit}>
              {t("account.resetPassword.submit")}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
