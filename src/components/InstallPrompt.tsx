import { useCallback, useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('pwa-install-dismissed') === '1');
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const onInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') setDeferred(null);
  }, [deferred]);

  const dismiss = () => {
    localStorage.setItem('pwa-install-dismissed', '1');
    setDismissed(true);
  };

  if (installed || dismissed) return null;

  if (isIos() && !deferred) {
    return (
      <div className="mx-4 mb-2 rounded-xl border border-steel bg-stainless-100 px-3 py-2 text-xs text-chef-subtle">
        <strong className="text-chef">Install on iPhone:</strong> tap Share → Add to Home Screen. Or keep using SousChef in Safari — everything works online.
        <button type="button" onClick={dismiss} className="ml-2 text-chef-muted underline">Dismiss</button>
      </div>
    );
  }

  if (!deferred) return null;

  return (
    <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl border border-chef/20 bg-chef/5 px-3 py-2">
      <Download size={18} className="text-chef shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-chef">Install SousChef</p>
        <p className="text-xs text-chef-subtle">Add to your home screen — works offline-ready, or keep using the web app.</p>
      </div>
      <button type="button" onClick={install} className="btn-primary !min-h-[40px] !py-2 text-xs shrink-0">
        Install
      </button>
      <button type="button" onClick={dismiss} className="btn-icon shrink-0" aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}
