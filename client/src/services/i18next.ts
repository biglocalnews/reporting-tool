import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackendApi from "i18next-http-backend";
import { initReactI18next } from "react-i18next";

i18next
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  // load translation using http -> see /public/locales (i.e. https://github.com/i18next/react-i18next/tree/master/example/react/public/locales)
  // learn more: https://github.com/i18next/i18next-http-backend
  .use(HttpBackendApi)
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    fallbackLng: "en",
    lowerCaseLng: true,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    debug: process.env.NODE_ENV === "development",
    backend: {
      requestOptions: {
        cache: "no-cache",
      },
      queryStringParams: { t: process.env.REACT_APP_BUILD_TS },
    },
  });

export default i18next;
