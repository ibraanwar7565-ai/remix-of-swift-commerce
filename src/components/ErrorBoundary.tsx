import { Component, type ErrorInfo, type ReactNode } from "react";
import { handleStaleBuild } from "@/lib/pwa";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

function isChunkLoadError(error: Error) {
  const text = `${error.name} ${error.message}`;
  return /ChunkLoadError|Loading chunk|dynamically imported module|Importing a module script failed/i.test(text);
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crashed:", error, info.componentStack);
    // A failed chunk almost always means a stale cached build.
    if (isChunkLoadError(error)) {
      void handleStaleBuild();
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The app hit an unexpected error while loading. Reloading usually fixes it.
        </p>
        <pre className="max-h-48 max-w-full overflow-auto rounded-md bg-muted p-3 text-left text-xs text-muted-foreground">
          {error.message || String(error)}
        </pre>
        <button
          onClick={() => window.location.reload()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Reload
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
