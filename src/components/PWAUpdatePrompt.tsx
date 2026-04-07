import { useRegisterSW } from 'virtual:pwa-register/react';

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex items-center justify-between rounded-lg bg-green-600 px-4 py-3 text-sm text-white shadow-lg sm:left-auto sm:right-4 sm:w-auto sm:min-w-[320px]">
      <span>New version available!</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="ml-4 rounded-md bg-white px-3 py-1 text-sm font-semibold text-green-700 hover:bg-green-50"
      >
        Refresh
      </button>
    </div>
  );
}
