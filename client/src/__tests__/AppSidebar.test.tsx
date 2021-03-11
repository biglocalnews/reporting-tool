import { AppSidebar } from "../components/AppSidebar";
import { shallow } from "enzyme"
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import uk from "../i18n/locales/en-gb/translation.json"
import SubMenu from "antd/lib/menu/SubMenu";

// Mock react-i18next
i18next
  .use(initReactI18next)
  .init({
    lng: "en-gb",
    fallbackLng: "en-gb",
    interpolation: {
      escapeValue: false,
    },
    debug: true,
    keySeparator: false,
    resources: { "en-gb": { translation: uk } },
    lowerCaseLng: true,
  });

it('Translates sidebar title text', () => {
  console.log(uk)
  const sidebar = shallow(<AppSidebar />);
  expect(sidebar.find(SubMenu).first().prop('title')).toBe('My Programmes');
})