import React from "react";
import { shallow } from "enzyme";
import App from "../App";

describe('App Component', () => {
  test("renders without crashing", () => {
    const wrapper = shallow(<App />);
    expect(wrapper).toBeTruthy();
  });
});