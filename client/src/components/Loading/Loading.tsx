import { Spin } from "antd";
import { useTranslation } from "react-i18next";
import "./Loading.css";

/**
 * Full-screen loading spinner.
 */
export const Loading = () => {
  const { t } = useTranslation();
  return (
    <div
      id="loading-container"
      aria-hidden="false"
      aria-valuetext={t("loading")}
      aria-busy="true"
      role="progressbar"
      aria-label={t("loading")}
    >
      <Spin size="large" />
    </div>
  );
};
