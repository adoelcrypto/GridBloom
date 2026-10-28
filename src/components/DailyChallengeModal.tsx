/**
 * GridBloom - Daily Challenge Launcher Modal
 * Shows today's date, deterministic seeded puzzle rules, and recorded score.
 */

import React from 'react';
import { Calendar, Trophy, Play, X, Sparkles } from 'lucide-react';
import { getTodayDateString } from '../game/engine/daily';
import { loadDailyRecord } from '../storage/gameStorage';

interface DailyChallengeModalProps {
  onStartDaily: () => void;
  onClose: () => void;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({ onStartDaily, onClose }) => {
  const todayStr = getTodayDateString();
  const dailyRecord = loadDailyRecord(todayStr);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 select-none">
      <div className="w-full max-w-sm rounded-2xl bg-[#111827] border border-slate-800 p-6 shadow-2xl flex flex-col items-center text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
          <Calendar size={24} />
        </div>

        <h2 className="text-xl font-black text-white tracking-wide mb-1">DAILY CHALLENGE</h2>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700 mb-4">
          {todayStr}
        </span>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          Every player worldwide receives the exact same sequence of pieces for today's board. Test your strategy and compare scores!
        </p>

        {dailyRecord && dailyRecord.completed ? (
          <div className="w-full p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 mb-5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Today's Best Score</span>
            <div className="flex items-center justify-center gap-1.5 text-amber-300 font-black text-2xl tabular-nums">
              <Trophy size={18} className="text-amber-400" />
              <span>{dailyRecord.score.toLocaleString()}</span>
            </div>
            <span className="text-[11px] text-emerald-400 mt-1 block">Challenge Completed! (You can replay to beat it)</span>
          </div>
        ) : (
          <div className="w-full p-3 rounded-xl bg-slate-900/60 border border-slate-800 mb-5">
            <div className="flex items-center justify-center gap-1.5 text-slate-300 text-xs font-semibold">
              <Sparkles size={14} className="text-cyan-400" />
              <span>Challenge awaiting today's attempt!</span>
            </div>
          </div>
        )}

        <div className="w-full flex flex-col gap-2">
          <button
            onClick={onStartDaily}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-md transition active:scale-98 cursor-pointer"
          >
            <Play size={16} fill="currentColor" />
            <span>{dailyRecord ? 'PLAY AGAIN' : 'START DAILY CHALLENGE'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
