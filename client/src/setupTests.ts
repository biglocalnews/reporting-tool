import "@testing-library/jest-dom";
import { configure } from "enzyme";
// Replaced enzyme-adapter-react-16 with @wojtekmaj/enzyme-adapter-react-17
// since there's no enzyme-adapter-react-17 yet.
// See: https://github.com/enzymejs/enzyme/pull/2430
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import "@testing-library/jest-dom/extend-expect";
import { toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

configure({ adapter: new Adapter() });
