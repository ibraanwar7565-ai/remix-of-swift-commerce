import { Component, type ErrorInfo, type ReactNode } from "react";
import logo from "@/assets/logo.png";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crashed:", error, info.componentStack);
  }

  private handleReload = async () => {
    try {
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.allSettled(regs.map((r) => r.unregister()));
      }
    } catch {
      /* ignore */
    }
    try {
      if (typeof caches !== "undefined") {
        const names = await caches.keys();
        await Promise.allSettled(names.map((n) => caches.delete(n)));
      }
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <img src={logo} alt="HALLO FRESH MARKET" className="h-16 w-16 object-contain" />
        <h1 className="text-lg font-semibold text-foreground">Something went wrong</h1>
        <p className="max-w-md break-words text-xs text-muted-foreground">
          {error.message || String(error)}
        </p>
        <button
          onClick={this.handleReload}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Reload app
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
