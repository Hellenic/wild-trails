"use client";

import React, { PropsWithChildren } from "react";

type ErrorBoundaryState = {
  error: Error | null;
};

class ErrorBoundary extends React.Component<
  PropsWithChildren,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { error: null };
  }

  componentDidCatch(error: Error) {
    this.setState({ error });
    console.error("Error caught", error);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return <pre>{JSON.stringify(this.state.error, null, 2)}</pre>;
  }
}

export default ErrorBoundary;
