import React from "react";
import { ErrorFallback } from "./ErrorFallback";

export type ErrorBoundaryState = {
  error: Error | null;
};

export type ErrorBoundaryProps = {
  children: React.ReactNode;
};

/**
 * Class to handle errors thrown during rendering.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public static getDerivedStateFromError(error: Error) {
    return { error };
  }

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      error: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // TODO: Add server-side error logging, such as via sentry.
    console.error("Error boundary caught error", error, errorInfo);
  }

  public render() {
    if (this.state.error) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
