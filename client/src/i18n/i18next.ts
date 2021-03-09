import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackendApi from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

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
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    debug: process.env.NODE_ENV === "development",
    backend: {
      // for all available options read the backend's repository readme file
      loadPath: "./locales/{{lng}}/translation.json",
      // path to post missing resources
      addPath: "./locales/add/{{lng}}.json",
    },
  });

export default i18next;
