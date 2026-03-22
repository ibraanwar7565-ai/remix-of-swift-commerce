import { useState, useEffect } from 'react';
import { Download, Share, CheckCircle, Smartphone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) setIsInstalled(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Install App</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 gap-8 pb-12">
        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center">
          <Smartphone className="h-12 w-12 text-primary" />
        </div>

        {isInstalled ? (
          <div className="text-center space-y-3">
            <CheckCircle className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">Already Installed!</h2>
            <p className="text-muted-foreground">HALLOFRESH is already on your home screen.</p>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Get the App</h2>
            <p className="text-muted-foreground max-w-sm">
              Install HALLOFRESH on your phone for a faster, app-like experience with offline access.
            </p>
          </div>
        )}

        {!isInstalled && (
          <div className="w-full max-w-sm space-y-4">
            {deferredPrompt ? (
              <Button onClick={handleInstall} className="w-full h-14 text-lg rounded-2xl gap-2" size="lg">
                <Download className="h-5 w-5" />
                Install Now
              </Button>
            ) : isIOS ? (
              <div className="bg-card rounded-2xl p-5 space-y-4 border border-border">
                <p className="font-semibold text-foreground text-center">Install on iPhone/iPad</p>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    <p>Tap the <Share className="inline h-4 w-4" /> <strong>Share</strong> button in Safari</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                    <p>Scroll down and tap <strong>"Add to Home Screen"</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                    <p>Tap <strong>"Add"</strong> to confirm</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-2xl p-5 space-y-3 border border-border text-center">
                <p className="font-semibold text-foreground">Install from Browser</p>
                <p className="text-sm text-muted-foreground">
                  Open the browser menu (⋮) and select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 w-full max-w-sm pt-4">
          {[
            { icon: '⚡', label: 'Fast & Smooth' },
            { icon: '📴', label: 'Works Offline' },
            { icon: '🔔', label: 'Quick Access' },
          ].map((feature) => (
            <div key={feature.label} className="bg-card rounded-xl p-3 text-center border border-border">
              <span className="text-2xl">{feature.icon}</span>
              <p className="text-xs text-muted-foreground mt-1">{feature.label}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Install;
