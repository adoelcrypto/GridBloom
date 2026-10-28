/**
 * GridBloom - Settings Modal Dialog
 * Sound effects, volume slider, reduced motion, tutorial replay, and data reset.
 */

import React from 'react';
import { Settings as SettingsIcon, Volume2, VolumeX, Eye, BookOpen, Trash2, X, Share2 } from 'lucide-react';
import { GameSettings } from '../storage/gameStorage';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onReplayTutorial: () => void;
  onResetStats: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onReplayTutorial,
  onResetStats,
  onClose,
}) => {
  const handleToggleSound = () => {
    onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({ ...settings, soundVolume: parseFloat(e.target.value) });
  };

  const handleToggleMotion = () => {
    onUpdateSettings({ ...settings, reducedMotion: !settings.reducedMotion });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 select-none">
      <div className="w-full max-w-sm rounded-2xl bg-[#111827] border border-slate-800 p-6 shadow-2xl flex flex-col relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close settings"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon size={20} className="text-cyan-400" />
          <h2 className="text-lg font-black text-white tracking-wide">SETTINGS</h2>
        </div>

        <div className="space-y-4 text-xs">
          {/* Sound Controls */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white flex items-center gap-2">
                {settings.soundEnabled ? <Volume2 size={15} className="text-cyan-400" /> : <VolumeX size={15} className="text-slate-500" />}
                Sound Effects
              </span>
              <button
                onClick={handleToggleSound}
                className={`w-10 h-5 rounded-full transition relative cursor-pointer ${
                  settings.soundEnabled ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
                aria-label="Toggle sound"
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    settings.soundEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.soundEnabled && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-slate-400">Volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.soundVolume}
                  onChange={handleVolumeChange}
                  className="flex-1 accent-cyan-400 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 w-6 text-right">
                  {Math.round(settings.soundVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex flex-col">
              <span className="font-bold text-white flex items-center gap-2">
                <Eye size={15} className="text-emerald-400" />
                Reduced Motion
              </span>
              <span className="text-[10px] text-slate-400">Diminish animations and flashes</span>
            </div>
            <button
              onClick={handleToggleMotion}
              className={`w-10 h-5 rounded-full transition relative cursor-pointer ${
                settings.reducedMotion ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
              aria-label="Toggle reduced motion"
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  settings.reducedMotion ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Replay Tutorial */}
          <button
            onClick={() => {
              onClose();
              onReplayTutorial();
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-slate-200 transition cursor-pointer"
          >
            <span className="font-bold flex items-center gap-2">
              <BookOpen size={15} className="text-amber-400" />
              Replay Tutorial
            </span>
            <span className="text-[10px] text-slate-400">Review game rules</span>
          </button>

          {/* Share Game Link */}
          <button
            onClick={async () => {
              const url = window.location.origin;
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: 'GridBloom',
                    text: 'Ayo main GridBloom! Game puzzle balok seru dengan Bloom Pulse!',
                    url,
                  });
                  return;
                } catch {}
              }
              await navigator.clipboard.writeText(url);
              alert('Link game berhasil disalin ke clipboard!');
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-slate-200 transition cursor-pointer"
          >
            <span className="font-bold flex items-center gap-2">
              <Share2 size={15} className="text-cyan-400" />
              Bagikan Link Game
            </span>
            <span className="text-[10px] text-cyan-400">Salin Link</span>
          </button>

          {/* Reset Stats */}
          <button
            onClick={() => {
              if (window.confirm('Reset personal best score and local statistics?')) {
                onResetStats();
              }
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 text-rose-300 transition cursor-pointer"
          >
            <span className="font-bold flex items-center gap-2">
              <Trash2 size={15} />
              Reset Local Statistics
            </span>
            <span className="text-[10px] text-rose-400">Clear records</span>
          </button>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 text-center">
          <span className="text-[10px] text-slate-400">GridBloom v1.0.0 · Mobile-First Puzzle</span>
        </div>
      </div>
    </div>
  );
};
