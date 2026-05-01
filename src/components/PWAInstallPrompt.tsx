"use client";

import { useEffect, useState } from 'react';
import { TriangleAlert, X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed);
      // Don't show again for 3 days
      if (Date.now() - dismissedAt < 3 * 24 * 60 * 60 * 1000) return;
    }

    if (ios) {
      // Show iOS instructions after 3 seconds
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }

    // Listen for Chrome/Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (!show || isInstalled) return null;

  return (
    <div className="fixed bottom-20 xl:bottom-6 left-4 right-4 z-50 max-w-sm mx-auto animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#0d1526] border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 h-10 w-10 rounded-xl overflow-hidden shadow-lg shadow-red-900/40">
            <img src="/icons/logo.png" alt="Emergency Hotline" className="w-full h-full object-cover" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-tight">Install Emergency Hotline</p>
            {isIOS ? (
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Tap <span className="text-white font-semibold">Share</span> then{' '}
                <span className="text-white font-semibold">"Add to Home Screen"</span> for instant emergency access.
              </p>
            ) : (
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Add to your home screen for faster emergency reporting — works offline too.
              </p>
            )}

            {!isIOS && (
              <button
                onClick={handleInstall}
                className="mt-3 flex items-center gap-1.5 h-8 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors shadow-lg shadow-red-900/30"
              >
                <Download className="h-3.5 w-3.5" />
                Install App
              </button>
            )}

            {isIOS && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <Smartphone className="h-3.5 w-3.5" />
                <span>iOS Safari only</span>
              </div>
            )}
          </div>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
