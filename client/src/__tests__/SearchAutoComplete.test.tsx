import { shallow } from "enzyme";
import { render } from "@testing-library/react";
import { SearchAutoComplete } from "../components/SearchAutoComplete";
import { axe } from "jest-axe";

describe("accessibility", () => {
  it("should not have basic accessibility issues", async () => {
    const { container } = render(<SearchAutoComplete dataSource={[]} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
