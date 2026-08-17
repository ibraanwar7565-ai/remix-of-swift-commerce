import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { setupPWA } from "./lib/pwa";
import "./index.css";

const container = document.getElementById("root");

function renderBootError(message: string) {
  const target = container ?? document.body;
  target.innerHTML = `
    <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;font-family:system-ui,sans-serif;text-align:center;background:#fff;color:#111">
      <h1 style="font-size:18px;font-weight:600;margin:0">The app failed to start</h1>
      <pre style="max-width:520px;max-height:200px;overflow:auto;background:#f4f4f5;padding:12px;border-radius:8px;font-size:12px;text-align:left;white-space:pre-wrap">${message}</pre>
      <button onclick="window.location.reload()" style="padding:8px 16px;border-radius:8px;border:0;background:#166534;color:#fff;font-weight:600;cursor:pointer">Reload</button>
    </div>`;
}

try {
  if (!container) throw new Error('Root element "#root" was not found in the document.');
  createRoot(container).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>,
  );
} catch (error) {
  console.error("Boot failure:", error);
  renderBootError(error instanceof Error ? `${error.name}: ${error.message}` : String(error));
}

void setupPWA();
