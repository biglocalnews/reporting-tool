import { Alert, Button, Card, Form, Input, message, PageHeader } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom";
import { useUserAccountManager } from "../../components/UserAccountManagerProvider";
import { usePasswordStrength } from "./PasswordStrength";
import "./ResetAccountPassword.css";

/**
 * Form to reset a password, provided they pass a valid token.
 */
export const ResetAccountPassword = () => {
  const { t } = useTranslation();
  const account = useUserAccountManager();
  const history = useHistory();
  const location = useLocation();
  const strength = usePasswordStrength();
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
        <Form
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 14 }}
          onFinish={saveNewPassword}
        >
          <PageHeader
            title={t("account.resetPassword.title")}
            subTitle={t("account.resetPassword.subtitle")}
          />
          <Form.Item label={t("account.resetPassword.newPasswordLabel")}>
            <Form.Item
              noStyle
              hasFeedback
              rules={[
                {
                  required: true,
                  message: t("account.resetPassword.missingPassword"),
                },
                () => ({
                  validator(_, value) {
                    if (!value) {
                      return Promise.resolve();
                    }

                    const analysis = strength.analyze(value);
                    if (analysis.score < 3) {
                      return Promise.reject(
                        new Error(
                          analysis.feedback.warning ||
                            analysis.feedback.suggestions[0] ||
                            t("account.resetPassword.weakPassword")
                        )
                      );
                    }

                    return Promise.resolve();
                  },
                }),
              ]}
              name="password"
            >
              <Input.Password
                onChange={(e) => strength.analyze(e.target.value)}
                aria-required="true"
                aria-label={t("account.resetPassword.newPasswordLabel")}
                disabled={!canSubmit}
              />
            </Form.Item>
            {strength.meter}
          </Form.Item>

          <Form.Item
            label={t("account.resetPassword.retypePasswordLabel")}
            rules={[
              {
                required: true,
                message: t("account.resetPassword.missingPassword"),
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (value && getFieldValue("password") !== value) {
                    return Promise.reject(
                      new Error(t("account.resetPassword.passwordsDoNotMatch"))
                    );
                  }

                  return Promise.resolve();
                },
              }),
            ]}
            name="confirmPassword"
          >
            <Input.Password
              aria-required="true"
              aria-label={t("account.resetPassword.retypePasswordLabel")}
              disabled={!canSubmit}
            />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button
              loading={resetting}
              htmlType="submit"
              type="primary"
              disabled={!canSubmit}
            >
              {t("account.resetPassword.submit")}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ResetAccountPassword;
