/**
 * GridBloom - PWA Install & Share Component
 * Handles Android/Chromium native installation, iOS Safari Add-to-Home-Screen guide,
 * and Native Web Share API with clipboard copy fallback.
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Share2, Check, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Detect if already installed / running standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isAppleDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Default explanation if browser doesn't expose prompt
      setShowIOSModal(true);
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-white text-xs font-semibold transition active:scale-95 cursor-pointer shadow-sm"
        aria-label="Install app on device"
      >
        <Download size={14} className="text-emerald-400" />
        <span>Install App</span>
      </button>

      {/* Guide Modal for iOS Safari / Unsupported prompt */}
      {showIOSModal &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 select-none">
            <div className="w-full max-w-sm rounded-2xl bg-[#111827] border border-slate-800 p-6 shadow-2xl flex flex-col relative text-center z-[101]">
              <button
                onClick={() => setShowIOSModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>

              <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
                <Smartphone size={24} />
              </div>

              <h3 className="text-base font-black text-white tracking-wide mb-1">
                {isIOS ? 'Pasang di iPhone / iPad' : 'Pasang di Layar Utama (Home Screen)'}
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Jadikan GridBloom aplikasi layar penuh tanpa browser bar!
              </p>

              <div className="text-left text-xs bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-2 text-slate-300 mb-5">
                {isIOS ? (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                      <span>Buka game ini di browser <strong>Safari</strong>.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                      <span>Ketuk ikon <strong>Bagikan (Share)</strong> di bilah bawah Safari.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                      <span>Gulir ke bawah dan ketuk <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                      <span>Ketuk menu titik tiga <strong>(⋮)</strong> di pojok kanan atas browser Chrome / Edge.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                      <span>Pilih <strong>Pasang Aplikasi (Install App)</strong> atau <strong>Tambahkan ke Layar Utama</strong>.</span>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-98 cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export const ShareGameButton: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: 'GridBloom - Casual Block Puzzle',
      text: 'Mainkan GridBloom! Game puzzle balok kasual dengan mekanik Bloom Pulse yang seru!',
      url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or share failed, fallback to copy
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs hover:text-white hover:border-slate-700 transition cursor-pointer"
      aria-label="Share game link"
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} className="text-cyan-400" />}
      <span>{copied ? 'Tersalin!' : 'Bagikan'}</span>
    </button>
  );
};
