/// <reference types="vite-plugin-pwa/client" />

const APP_SW_PATH = "/sw.js";

function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  if (typeof window === "undefined") return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).has("sw") &&
      new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterAppServiceWorkers() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => {
          const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
          return url.endsWith(APP_SW_PATH);
        })
        .map((r) => r.unregister()),
    );
  } catch {
    /* ignore */
  }
}

/**
 * Registers the app service worker only in safe production contexts.
 * On a new version it activates immediately and reloads once so users never
 * get left on a stale cached build (blank screen).
 */
export async function setupPWA() {
  if (isRefusedContext()) {
    await unregisterAppServiceWorkers();
    return;
  }

  // Recover from a stale build: a failed chunk import means the cached HTML
  // points at assets that no longer exist. Clear caches and reload once.
  window.addEventListener("vite:preloadError", async () => {
    await handleStaleBuild();
  });

  try {
    const { registerSW } = await import("virtual:pwa-register");
    let reloading = false;

    // Workbox skipWaiting activates the new worker immediately. Reload as soon
    // as it takes control so the page and its hashed chunks are the same build.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });

    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        if (reloading) return;
        void updateSW(true);
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;
        setInterval(() => registration.update().catch(() => {}), 60 * 1000);
      },
      onRegisterError(error) {
        console.error("SW registration error:", error);
      },
    });
  } catch (error) {
    console.error("PWA setup failed:", error);
  }
}

const STALE_RELOAD_KEY = "pwa-stale-reload-at";

export async function handleStaleBuild() {
  try {
    const last = Number(sessionStorage.getItem(STALE_RELOAD_KEY) || 0);
    if (Date.now() - last < 30_000) return; // avoid reload loops
    sessionStorage.setItem(STALE_RELOAD_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
  await unregisterAppServiceWorkers();
  try {
    const names = await caches.keys();
    await Promise.allSettled(names.filter((n) => /precache|runtime/i.test(n)).map((n) => caches.delete(n)));
  } catch {
    /* ignore */
  }
  window.location.reload();
}
