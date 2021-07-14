import { Alert, Button, message } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom";
import { Loading } from "../components/Loading/Loading";
import { useUserAccountManager } from "../components/UserAccountManagerProvider";

/**
 * Component to verify a user's account.
 *
 * If all goes well no UI is shown, this just POSTs the token to the server and
 * redirects to the home page.
 *
 * If an error occurs, this displays the error. In this case the user can
 * generate a new token and repeat.
 */
export const VerifyAccount = () => {
  const { t } = useTranslation();
  const account = useUserAccountManager();
  const history = useHistory();
  const location = useLocation();
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<Error | null>(null);

  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");
  const email = queryParams.get("email");

  /**
   * Request a new verification token.
   */
  const verifyAgain = async () => {
    try {
      if (!email) {
        throw new Error("missing email");
      }
      await account.requestVerifyUser(email);
      message.success(t("account.verify.reverifySuccess", { email }));
    } catch (e) {
      message.error(t("account.verify.reverifyError", { message: e.message }));
    }
  };

  // Try to verify the token when the component mounts.
  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setVerifyError(new Error("MISSING_TOKEN"));
      return;
    } else {
      setVerifying(true);
      setVerifyError(null);
    }

    account
      .verify(token)
      .then(() => {
        message.success(t("account.verify.success"));
        history.push("/");
      })
      .catch((e) => {
        if (e.message === "VERIFY_USER_ALREADY_VERIFIED") {
          message.warn(t("account.verify.errors.VERIFY_USER_ALREADY_VERIFIED"));
          history.push("/");
          return;
        }
        setVerifyError(e);
      })
      .then(() => {
        setVerifying(false);
      });
  }, []);

  // Verification should be very quick, but show a spinner just in case.
  if (verifying) {
    return <Loading />;
  }

  // Errors should just prompt user to retry.
  if (verifyError) {
    return (
      <Alert
        type="error"
        showIcon
        action={
          <Button type="primary" danger onClick={verifyAgain}>
            {t("account.verify.action")}
          </Button>
        }
        description={t(`account.verify.errors.${verifyError.message}`)}
        message={t("account.verify.error")}
      />
    );
  }

  // The user will be redirected if the token is validated.
  return (
    <Alert
      type="success"
      showIcon
      description={t("account.verify.successDetail")}
      message={t("account.verify.success")}
    />
  );
};
