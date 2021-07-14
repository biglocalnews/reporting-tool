import { TFunction, useTranslation } from "react-i18next";

/**
 * Wrap the t function to inject the given prefix to every key.
 */
const tWithPrefix =
  (t: TFunction, prefix: string) =>
  (...args: Parameters<TFunction>) => {
    args[0] = `${prefix}.${args[0]}`;
    return t(...args);
  };

/**
 * Hook that wraps `useTranslation` to add a prefix to the t function.
 *
 * The prefixed version of the t function is available as `tp`. The original
 * t function and all other keys of the useTranslation return value are also
 * still available.
 *
 * Example:
 *   const { tp, t } = useTranslationWithPrefix("admin.team.index");
 *
 *   // The following values are equivalent:
 *   tp("title");
 *   t("admin.team.index.title");
 */
export const useTranslationWithPrefix = (prefix: string) => {
  const t10 = useTranslation();
  return {
    ...t10,
    tp: tWithPrefix(t10.t, prefix),
  };
};
