import { render } from "@testing-library/react";
import { SearchAutoComplete } from "../components/SearchAutoComplete";
import { axe } from "jest-axe";

jest.mock("react-i18next", () => ({
  // this mock makes sure any components using the translate
  // hook can use it without a warning being shown
  useTranslation: () => {
    return {
      t: (str: string) => str,
      i18n: {
        /* tslint:disable:no-empty */
        changeLanguage: () => new Promise(() => {}),
      },
    };
  },
}));

describe("accessibility", () => {
  it("should not have basic accessibility issues", async () => {
    const { container } = render(<SearchAutoComplete dataSource={[]} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
