/**
 * GridBloom - HUD Header & Pulse Energy Meter
 * World-matched styling, tabular numerals, and Bloom Pulse ability toggle.
 */

import React from 'react';
import { Pause, Volume2, VolumeX, Zap, Sparkles } from 'lucide-react';
import { MAX_PULSE_CHARGE } from '../game/engine/rules';

interface HudBarProps {
  score: number;
  personalBest: number;
  combo: number;
  pulseCharge: number;
  pulseActive: boolean;
  isMuted: boolean;
  gameMode: 'classic' | 'daily';
  onTogglePause: () => void;
  onToggleMute: () => void;
  onTogglePulse: () => void;
}

export const HudBar: React.FC<HudBarProps> = ({
  score,
  personalBest,
  combo,
  pulseCharge,
  pulseActive,
  isMuted,
  gameMode,
  onTogglePause,
  onToggleMute,
  onTogglePulse,
}) => {
  const isPulseCharged = pulseCharge >= MAX_PULSE_CHARGE;
  const pulsePercent = Math.min(100, Math.floor((pulseCharge / MAX_PULSE_CHARGE) * 100));

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-3 pb-1 select-none z-20">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        {/* Score Cluster */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {gameMode === 'daily' ? 'Daily Score' : 'Score'}
          </span>
          <span className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight">
            {score.toLocaleString()}
          </span>
        </div>

        {/* Combo Badge (if combo > 1) */}
        {combo > 1 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-xs shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse">
            <Sparkles size={13} fill="currentColor" />
            <span>x{combo} COMBO!</span>
          </div>
        )}

        {/* Personal Best & Utilities */}
        <div className="flex items-center gap-2">
          {personalBest > 0 && (
            <div className="hidden sm:flex flex-col items-end mr-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Best</span>
              <span className="text-sm font-bold text-amber-300 tabular-nums">
                {personalBest.toLocaleString()}
              </span>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer"
            aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {/* Pause Button */}
          <button
            onClick={onTogglePause}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer"
            aria-label="Pause game"
          >
            <Pause size={18} />
          </button>
        </div>
      </div>

      {/* Bloom Pulse Energy Meter Strip */}
      <div className="w-full flex items-center gap-2 bg-slate-900/90 border border-slate-800/80 rounded-xl px-3 py-1.5 shadow-sm">
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-300">
          <Zap size={14} className={isPulseCharged ? 'text-amber-400 animate-bounce' : 'text-cyan-400'} fill="currentColor" />
          <span className="hidden xs:inline">PULSE</span>
        </div>

        {/* Progress Bar Container */}
        <div className="relative flex-1 h-3 rounded-full bg-slate-950/80 overflow-hidden border border-slate-800/60">
          <div
            className={`h-full transition-all duration-300 ${
              isPulseCharged
                ? 'bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-400 animate-pulse'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
            }`}
            style={{ width: `${pulsePercent}%` }}
          />
        </div>

        <span className="text-[11px] font-bold text-slate-400 tabular-nums min-w-[32px] text-right">
          {pulsePercent}%
        </span>

        {/* Pulse Action Button */}
        {isPulseCharged && (
          <button
            onClick={onTogglePulse}
            className={`px-2.5 py-0.5 rounded-lg font-black text-xs transition cursor-pointer ${
              pulseActive
                ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.8)]'
                : 'bg-amber-500/20 border border-amber-400 text-amber-300 hover:bg-amber-400 hover:text-slate-950'
            }`}
          >
            {pulseActive ? 'SELECT LINE' : 'USE PULSE'}
          </button>
        )}
      </div>

      {/* Helper text when pulse is active */}
      {pulseActive && (
        <div className="text-center mt-1">
          <span className="text-[11px] font-medium text-amber-300 animate-pulse">
            ✦ Tap any non-empty Row or Column on the board to vaporize it!
          </span>
        </div>
      )}
    </div>
  );
};
