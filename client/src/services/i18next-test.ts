import i18nextTest from "i18next";
import { initReactI18next } from "react-i18next";
import translationUKEnglish from "../../public/locales/en-gb/translation.json";
import translationEnglish from "../../public/locales/en/translation.json";

i18nextTest.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en-gb",
  interpolation: {
    escapeValue: false,
  },
  keySeparator: false,
  lowerCaseLng: true,
  react: {
    useSuspense: false,
  },
  resources: {
    "en-gb": {
      translation: translationUKEnglish,
    },
    en: {
      translation: translationEnglish,
    },
  },
});

export default i18nextTest;
