import { Alert } from "antd";
import { ApolloError } from "@apollo/client";
import "./ErrorFallback.css";

interface ErrorProps {
  error: Error | ApolloError;
}

export const ErrorFallback = ({ error }: ErrorProps): JSX.Element => {
  return (
    <Alert
      className="error-alert"
      role="alert"
      message="Oh, no! Something went wrong"
      description={`${error.message} Please refresh and try again.`}
      type="error"
      showIcon
      closable
    />
  );
};
