/**
 * GridBloom - Pause Modal Overlay
 * Standard game shell modal with Resume, Restart, and Title navigation.
 */

import React, { useEffect } from 'react';
import { Play, RotateCcw, Home } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ onResume, onRestart, onHome }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        onResume();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onResume]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 select-none">
      <div className="w-full max-w-xs rounded-2xl bg-[#111827] border border-slate-800 p-6 shadow-2xl flex flex-col items-center text-center">
        <h2 className="text-2xl font-black text-white tracking-wide mb-1">GAME PAUSED</h2>
        <p className="text-xs text-slate-400 mb-6">Take a breather, the board is waiting.</p>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-md transition active:scale-98 cursor-pointer"
          >
            <Play size={18} fill="currentColor" />
            <span>RESUME</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 text-white font-semibold text-sm transition active:scale-98 cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>Restart Run</span>
          </button>

          <button
            onClick={onHome}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white font-medium text-sm transition active:scale-98 cursor-pointer"
          >
            <Home size={16} />
            <span>Return to Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
