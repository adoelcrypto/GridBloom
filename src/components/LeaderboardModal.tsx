/**
 * GridBloom - Leaderboard Dialog
 * Supports online and local rankings, guest alias editing, and transparent offline states.
 */

import React, { useEffect, useState } from 'react';
import { Trophy, Calendar, Globe, X, RefreshCw, UserCheck, ShieldCheck, AlertCircle } from 'lucide-react';
import { leaderboardService, LeaderboardEntry } from '../services/supabase/leaderboardService';
import { loadPlayerProfile, savePlayerProfile, PlayerProfile, loadStats, loadDailyRecord } from '../storage/gameStorage';
import { getTodayDateString } from '../game/engine/daily';

interface LeaderboardModalProps {
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose }) => {
  const [tab, setTab] = useState<'classic' | 'daily'>('classic');
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const [profile, setProfile] = useState<PlayerProfile>(loadPlayerProfile());
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.displayName);

  const isOnlineConfigured = leaderboardService.isOnlineAvailable();

  const fetchScores = async () => {
    setLoading(true);
    setErrorMsg(null);

    if (!isOnlineConfigured) {
      // Local offline fallback
      setIsOfflineMode(true);
      setLoading(false);
      buildLocalEntries();
      return;
    }

    const todayStr = getTodayDateString();
    const res = await leaderboardService.fetchLeaderboard(tab, tab === 'daily' ? todayStr : undefined);

    setLoading(false);
    if (res.success && res.data) {
      setEntries(res.data);
      setIsOfflineMode(false);
    } else {
      setErrorMsg(res.error || 'Could not reach leaderboard');
      if (res.isOffline) {
        setIsOfflineMode(true);
        buildLocalEntries();
      }
    }
  };

  const buildLocalEntries = () => {
    const stats = loadStats();
    const todayStr = getTodayDateString();
    const dailyRec = loadDailyRecord(todayStr);

    const localList: LeaderboardEntry[] = [];
    if (tab === 'classic' && stats.personalBest > 0) {
      localList.push({
        id: 'local-1',
        displayName: `${profile.displayName} (You)`,
        score: stats.personalBest,
        linesCleared: stats.totalLinesCleared,
        maxCombo: stats.highestCombo,
        mode: 'classic',
        createdAt: new Date().toISOString(),
        isCurrentUser: true,
      });
    } else if (tab === 'daily' && dailyRec && dailyRec.score > 0) {
      localList.push({
        id: 'local-daily-1',
        displayName: `${profile.displayName} (You)`,
        score: dailyRec.score,
        linesCleared: 0,
        maxCombo: 0,
        mode: 'daily',
        createdAt: new Date().toISOString(),
        isCurrentUser: true,
      });
    }
    setEntries(localList);
  };

  useEffect(() => {
    fetchScores();
  }, [tab]);

  const handleSaveName = () => {
    const clean = nameInput.trim();
    if (clean.length >= 2 && clean.length <= 25) {
      const updated = { ...profile, displayName: clean };
      savePlayerProfile(updated);
      setProfile(updated);
      setEditingName(false);
    }
  };

  const handleToggleOnline = async () => {
    if (!profile.onlineEnabled) {
      setLoading(true);
      const res = await leaderboardService.enableOnlineFeatures();
      setLoading(false);
      if (res.success && res.data) {
        setProfile(res.data);
        fetchScores();
      } else {
        setErrorMsg(res.error || 'Failed to enable online features');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 select-none">
      <div className="w-full max-w-md h-[560px] rounded-2xl bg-[#111827] border border-slate-800 p-5 shadow-2xl flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-amber-400" />
            <h2 className="text-lg font-black text-white tracking-wide">LEADERBOARD</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close leaderboard"
          >
            <X size={18} />
          </button>
        </div>

        {/* Player Profile & Guest Display Name Bar */}
        <div className="flex items-center justify-between py-2 px-3 my-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Player:</span>
            {editingName ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-white text-xs w-28 focus:outline-none focus:border-cyan-400"
                  maxLength={25}
                />
                <button
                  onClick={handleSaveName}
                  className="px-2 py-0.5 bg-cyan-500 text-slate-950 font-bold rounded hover:bg-cyan-400 cursor-pointer text-[11px]"
                >
                  Save
                </button>
              </div>
            ) : (
              <span className="font-bold text-cyan-300">{profile.displayName}</span>
            )}
          </div>

          {!editingName && (
            <button
              onClick={() => setEditingName(true)}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
            >
              Change
            </button>
          )}
        </div>

        {/* Online vs Offline notice */}
        {isOfflineMode && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 mb-2 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-300 text-[11px]">
            <AlertCircle size={13} className="shrink-0" />
            <span>Local mode active. Online leaderboard service not configured.</span>
          </div>
        )}

        {/* Mode Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => setTab('classic')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl font-bold text-xs transition cursor-pointer ${
              tab === 'classic'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Trophy size={14} />
            <span>Classic Ranks</span>
          </button>

          <button
            onClick={() => setTab('daily')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl font-bold text-xs transition cursor-pointer ${
              tab === 'daily'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Calendar size={14} />
            <span>Today's Daily</span>
          </button>
        </div>

        {/* Scores Table / List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-1.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
              <RefreshCw size={20} className="animate-spin mb-2 text-cyan-400" />
              <span>Loading rankings...</span>
            </div>
          ) : entries.length > 0 ? (
            entries.map((entry, index) => {
              const rank = index + 1;
              const isTop3 = rank <= 3;
              const rankColor =
                rank === 1 ? 'text-amber-300' : rank === 2 ? 'text-slate-300' : rank === 3 ? 'text-amber-600' : 'text-slate-500';

              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
                    entry.isCurrentUser
                      ? 'bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      : 'bg-slate-900/70 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 font-black text-center ${rankColor} text-sm`}>
                      {rank}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-bold text-white">
                        {entry.displayName}
                        {entry.isCurrentUser && <span className="ml-1 text-[10px] text-cyan-400 font-semibold">(You)</span>}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {entry.linesCleared > 0 ? `${entry.linesCleared} lines · max x${entry.maxCombo}` : ''}
                      </span>
                    </div>
                  </div>

                  <span className="font-black text-cyan-300 text-sm tabular-nums">
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs text-center p-4">
              <Trophy size={28} className="text-slate-600 mb-2" />
              <p className="font-semibold text-slate-300 mb-1">No scores recorded yet</p>
              <p className="text-[11px] text-slate-400">Complete a game to claim the top spot on the board!</p>
            </div>
          )}
        </div>

        {/* Footer info / refresh */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>{entries.length} player{entries.length === 1 ? '' : 's'}</span>
          <button
            onClick={fetchScores}
            disabled={loading}
            className="flex items-center gap-1 text-slate-300 hover:text-cyan-400 cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
};
