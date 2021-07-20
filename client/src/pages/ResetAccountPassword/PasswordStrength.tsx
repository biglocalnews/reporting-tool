import { Progress } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import zxcvbn from "zxcvbn";

/**
 * Helper hook for analyzing password strength.
 */
export const usePasswordStrength = () => {
  const [analysis, setAnalysis] =
    useState<zxcvbn.ZXCVBNResult | undefined>(undefined);
  return {
    analyze: (password: string) => {
      const result = zxcvbn(password);
      setAnalysis(result);
      return result;
    },
    analysis,
    meter: <PasswordStrength analysis={analysis} />,
  };
};

export type PasswordStrengthBarProps = {
  analysis?: zxcvbn.ZXCVBNResult;
};

/**
 * Graphical indication of password strength.
 */
export const PasswordStrength = ({ analysis }: PasswordStrengthBarProps) => {
  const { t } = useTranslation();
  const score = analysis?.score || 0;

  return (
    <div style={{ width: "100%" }}>
      <Progress
        strokeColor={
          {
            0: "red",
            1: "red",
            2: "orange",
            3: "limegreen",
            4: "green",
          }[score]
        }
        percent={(100 * score) / 4}
        format={() =>
          score < 3
            ? t("account.resetPassword.weak")
            : t("account.resetPassword.strong")
        }
      />
    </div>
  );
};
