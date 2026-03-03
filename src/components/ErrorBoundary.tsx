import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
          <p className="font-body text-sm text-pheno-text-primary">
            Something went wrong.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="rounded-md border border-pheno-border px-4 py-2 font-body text-sm text-pheno-text-secondary transition-colors hover:bg-pheno-bg-secondary"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
