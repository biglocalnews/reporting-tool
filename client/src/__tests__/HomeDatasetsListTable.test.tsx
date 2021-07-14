import { render } from "@testing-library/react";
import { HomeDatasetsListTable } from "../pages/Home/HomeDatasetsListTable";
import { axe } from "jest-axe";

describe("accessibility", () => {
  it("should not have basic accessibility issues", async () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    const { container } = render(
      <HomeDatasetsListTable data={[]} columns={[]} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
