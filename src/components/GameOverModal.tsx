/**
 * GridBloom - Game Over Modal Dialog
 * Confetti on high scores, performance stats, rewarded rescue option, and leaderboard submission.
 */

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Home, Trophy, Sparkles, Video, Send, Check } from 'lucide-react';
import { adService } from '../services/ads/adProvider';
import { leaderboardService } from '../services/supabase/leaderboardService';
import { loadPlayerProfile } from '../storage/gameStorage';

interface GameOverModalProps {
  score: number;
  personalBest: number;
  isNewBest: boolean;
  linesCleared: number;
  maxCombo: number;
  gameMode: 'classic' | 'daily';
  dailyDate?: string;
  onPlayAgain: () => void;
  onHome: () => void;
  onRescue: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  personalBest,
  isNewBest,
  linesCleared,
  maxCombo,
  gameMode,
  dailyDate,
  onPlayAgain,
  onHome,
  onRescue,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [canRescue, setCanRescue] = useState(false);

  useEffect(() => {
    // Check if rescue is available
    setCanRescue(adService.isRescueAvailable());

    // Fire celebratory confetti on high score
    if (isNewBest && score > 0) {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#06B6D4', '#10B981', '#F59E0B', '#F43F5E', '#A855F7'],
        });
      } catch {
        // Ignore in environments without canvas support
      }
    }
  }, [isNewBest, score]);

  const handleRescueClick = async () => {
    const result = await adService.requestRewardedRescue();
    if (result.rewarded) {
      onRescue();
    } else {
      setCanRescue(false);
    }
  };

  const handleSubmitScore = async () => {
    setSubmitting(true);
    setSubmitError(null);

    const profile = loadPlayerProfile();
    if (!profile.onlineEnabled) {
      const res = await leaderboardService.enableOnlineFeatures();
      if (!res.success && res.error) {
        setSubmitError(res.error);
        setSubmitting(false);
        return;
      }
    }

    const sub = await leaderboardService.submitScore({
      score,
      linesCleared,
      maxCombo,
      mode: gameMode,
      dailyDate: dailyDate,
    });

    setSubmitting(false);
    if (sub.success) {
      setSubmitted(true);
    } else {
      setSubmitError(sub.error || 'Score submission failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 select-none overflow-y-auto">
      <div className="w-full max-w-sm rounded-2xl bg-[#111827] border border-slate-800 p-6 shadow-2xl flex flex-col items-center text-center my-auto">
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 shadow-inner">
          {isNewBest ? (
            <Trophy size={28} className="text-amber-400 animate-bounce" />
          ) : (
            <Sparkles size={28} className="text-cyan-400" />
          )}
        </div>

        <h2 className="text-2xl font-black text-white tracking-wide">
          {isNewBest ? 'NEW HIGH SCORE!' : 'GAME OVER'}
        </h2>
        <p className="text-xs text-slate-400 mb-4">No more legal moves fit on the board.</p>

        {/* Big Score Callout */}
        <div className="w-full py-3 px-4 rounded-xl bg-slate-900/90 border border-slate-800 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Final Score
          </span>
          <span className="text-3xl font-black text-white tabular-nums">
            {score.toLocaleString()}
          </span>
        </div>

        {/* Stat metrics */}
        <div className="grid grid-cols-2 gap-2 w-full mb-4">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Lines Cleared</span>
            <span className="text-lg font-black text-cyan-300 tabular-nums">{linesCleared}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Max Combo</span>
            <span className="text-lg font-black text-amber-300 tabular-nums">x{maxCombo}</span>
          </div>
        </div>

        {/* Rewarded Rescue Ability (1 per run) */}
        {canRescue && (
          <button
            onClick={handleRescueClick}
            className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md border border-violet-400/30 transition active:scale-98 cursor-pointer"
          >
            <Video size={16} />
            <span>RESCUE RUN (Clear Center & Continue)</span>
          </button>
        )}

        {/* Online Leaderboard Submission */}
        {leaderboardService.isOnlineAvailable() && (
          <div className="w-full mb-4">
            {!submitted ? (
              <button
                onClick={handleSubmitScore}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white font-semibold text-xs transition cursor-pointer"
              >
                <Send size={13} />
                <span>{submitting ? 'Submitting Score...' : 'Submit to Online Leaderboard'}</span>
              </button>
            ) : (
              <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-semibold py-1">
                <Check size={14} />
                <span>Score submitted to leaderboard!</span>
              </div>
            )}
            {submitError && (
              <span className="text-[11px] text-rose-400 mt-1 block">{submitError}</span>
            )}
          </div>
        )}

        {/* Navigation CTAs */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            data-start="true"
            onClick={onPlayAgain}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-md transition active:scale-98 cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={onHome}
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white font-medium text-xs transition active:scale-98 cursor-pointer"
          >
            <Home size={15} />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
