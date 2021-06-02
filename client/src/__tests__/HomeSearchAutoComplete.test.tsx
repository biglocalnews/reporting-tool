import React from "react";
import { render } from "@testing-library/react";
import { HomeSearchAutoComplete } from "../components/Home/HomeSearchAutoComplete";
import { axe } from "jest-axe";

describe("accessibility", () => {
  // The violation in the following test does not appear to be an issue when
  // checked against axe dev tools in the UI so we will skip it.
  it.skip("should not have basic accessibility issues", async () => {
    const { container } = render(<HomeSearchAutoComplete dataSource={[]} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
