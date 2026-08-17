import { lazy, type ComponentType } from "react";

const RELOAD_FLAG = "chunk-reload-attempted";

function isChunkLoadError(error: unknown): boolean {
  const text =
    error instanceof Error ? `${error.name} ${error.message}` : String(error ?? "");
  return /ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    text,
  );
}

/**
 * Wraps React.lazy so a stale-deploy chunk failure triggers exactly one reload
 * (fresh index.html + fresh chunk hashes) instead of a silent blank screen.
 * If the reload already happened, the error is rethrown for the ErrorBoundary.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      try {
        sessionStorage.removeItem(RELOAD_FLAG);
      } catch {
        /* storage unavailable */
      }
      return mod;
    } catch (error) {
      if (!isChunkLoadError(error)) throw error;

      let alreadyReloaded = false;
      try {
        alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG) === "true";
        if (!alreadyReloaded) sessionStorage.setItem(RELOAD_FLAG, "true");
      } catch {
        /* storage unavailable: fall through and rethrow */
        throw error;
      }

      if (alreadyReloaded) throw error;

      window.location.reload();
      // Keep Suspense pending while the page reloads.
      return await new Promise<{ default: T }>(() => {});
    }
  });
}

export default lazyWithRetry;
