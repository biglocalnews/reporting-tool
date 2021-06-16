import "@testing-library/jest-dom";
import { configure } from "enzyme";
// Replaced enzyme-adapter-react-16 with @wojtekmaj/enzyme-adapter-react-17
// since there's no enzyme-adapter-react-17 yet.
// See: https://github.com/enzymejs/enzyme/pull/2430
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import "@testing-library/jest-dom/extend-expect";
import { toHaveNoViolations } from "jest-axe";
import i18nextTest from "../src/services/i18next-test";

i18nextTest.createInstance();

// Mock HTTP requests via the `fetchMock` global.
import jestFetchMock from "jest-fetch-mock";
// Mocks are enabled to get global objects like Response. Note that it's
// usually better to avoid the fetchMock global and use dependency injection!
jestFetchMock.enableMocks();

expect.extend(toHaveNoViolations);

configure({ adapter: new Adapter() });

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
