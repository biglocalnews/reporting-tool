import { Spin } from "antd";
import "./Loading.css";

/**
 * Full-screen loading spinner.
 */
export const Loading = () => (
  <div id="loading-container">
    <Spin size="large" />
  </div>
);
