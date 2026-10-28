/**
 * GridBloom - Title Screen Component
 * Atmospheric game shell with bespoke SVG logo lockup, negative space, and keyboard start handshake.
 */

import React, { useEffect } from 'react';
import { Play, Calendar, Trophy, HelpCircle, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { PWAInstallButton, ShareGameButton } from './PWAInstallButton';

interface TitleScreenProps {
  personalBest: number;
  onStartClassic: () => void;
  onOpenDaily: () => void;
  onOpenLeaderboard: () => void;
  onOpenTutorial: () => void;
  onOpenSettings: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  personalBest,
  onStartClassic,
  onOpenDaily,
  onOpenLeaderboard,
  onOpenTutorial,
  onOpenSettings,
}) => {
  // Bind Enter and Space while on title screen to start immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onStartClassic();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartClassic]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-6 overflow-hidden bg-[#0B0F19] select-none">
      {/* Ambient background glow petals */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-gradient-to-tr from-cyan-500/15 via-purple-500/10 to-rose-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top bar with Share, Install, Help, and Settings */}
      <div className="w-full flex justify-between items-center z-10 max-w-md pt-2 gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTutorial}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs hover:text-cyan-400 hover:border-cyan-500/50 transition cursor-pointer"
            aria-label="How to play tutorial"
          >
            <HelpCircle size={15} />
            <span className="hidden xs:inline">Bantuan</span>
          </button>
          <ShareGameButton />
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton />
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
            aria-label="Open settings"
          >
            <SettingsIcon size={18} />
          </button>
        </div>
      </div>

      {/* Center Hero Lockup */}
      <div className="flex flex-col items-center text-center my-auto z-10">
        {/* Bespoke SVG GridBloom Emblem */}
        <div className="relative mb-4 group">
          <svg className="w-24 h-24 drop-shadow-[0_0_25px_rgba(6,182,212,0.4)]" viewBox="0 0 96 96" fill="none">
            {/* Outer socket */}
            <rect x="8" y="8" width="80" height="80" rx="20" fill="#131B2E" stroke="#1E293B" strokeWidth="2" />
            {/* Cross petals */}
            <rect x="36" y="16" width="24" height="24" rx="6" fill="#06B6D4" stroke="#22D3EE" strokeWidth="1.5" />
            <rect x="16" y="36" width="24" height="24" rx="6" fill="#F43F5E" stroke="#FB7185" strokeWidth="1.5" />
            <rect x="56" y="36" width="24" height="24" rx="6" fill="#10B981" stroke="#34D399" strokeWidth="1.5" />
            <rect x="36" y="56" width="24" height="24" rx="6" fill="#F59E0B" stroke="#FBBF24" strokeWidth="1.5" />
            {/* Core bloom spark */}
            <circle cx="48" cy="48" r="7" fill="#A855F7" stroke="#E9D5FF" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Title text with jewel gradient accent */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-1">
          Grid<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-300">Bloom</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm font-medium tracking-wide max-w-xs mb-6">
          Vibrant Block Puzzle with the Bloom Pulse Mechanic
        </p>

        {/* Personal Best Display */}
        {personalBest > 0 && (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-6 shadow-inner">
            <Trophy size={14} className="text-amber-400" />
            <span>BEST: {personalBest.toLocaleString()}</span>
          </div>
        )}

        {/* Action CTAs */}
        <div className="flex flex-col gap-3 w-64 max-w-xs">
          <button
            data-start="true"
            onClick={onStartClassic}
            className="flex items-center justify-center gap-2.5 w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-base shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_28px_rgba(16,185,129,0.5)] active:scale-98 transition transform cursor-pointer"
          >
            <Play size={20} fill="currentColor" />
            <span>PLAY CLASSIC</span>
          </button>

          <button
            onClick={onOpenDaily}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 text-white font-semibold text-sm hover:border-cyan-500/40 transition active:scale-98 cursor-pointer"
          >
            <Calendar size={17} className="text-cyan-400" />
            <span>Daily Challenge</span>
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-5 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 text-slate-300 font-semibold text-sm hover:text-white transition active:scale-98 cursor-pointer"
          >
            <Trophy size={17} className="text-amber-400" />
            <span>Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Flat control-hint line */}
      <div className="z-10 text-center pb-2">
        <p className="text-[11px] sm:text-xs text-slate-400 tracking-wide">
          Drag & Drop Pieces · Clear Lines · Charge Bloom Pulse · Esc Pause
        </p>
      </div>
    </div>
  );
};
