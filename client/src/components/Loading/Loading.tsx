import { Spin } from "antd";
import "./Loading.css";

/**
 * Full-screen loading spinner.
 */
export const Loading = ({ tip = "Loading..." }: any) => (
  <div
    id="loading-container"
    aria-hidden="false"
    aria-valuetext="Loading"
    aria-busy="true"
    role="progressbar"
    aria-label="Loading"
  >
    <Spin size="large" tip={tip} />
  </div>
);
