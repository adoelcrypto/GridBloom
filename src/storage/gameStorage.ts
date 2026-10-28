/**
 * GridBloom - Versioned Local Storage Service
 * Resilient against missing, corrupted, or outdated browser storage.
 */

import { GameState } from '../game/engine/rules';

const STORAGE_VERSION = 'v1';
const KEYS = {
  SETTINGS: `gridbloom_${STORAGE_VERSION}_settings`,
  STATS: `gridbloom_${STORAGE_VERSION}_stats`,
  SAVED_RUN: `gridbloom_${STORAGE_VERSION}_saved_run`,
  DAILY: `gridbloom_${STORAGE_VERSION}_daily`,
  PLAYER: `gridbloom_${STORAGE_VERSION}_player`,
};

export interface GameSettings {
  readonly soundEnabled: boolean;
  readonly soundVolume: number; // 0 to 1
  readonly reducedMotion: boolean;
  readonly tutorialCompleted: boolean;
}

export interface PlayerStats {
  readonly personalBest: number;
  readonly totalGamesPlayed: number;
  readonly totalLinesCleared: number;
  readonly highestCombo: number;
  readonly totalPulsesFired: number;
}

export interface DailyRecord {
  readonly date: string;
  readonly score: number;
  readonly completed: boolean;
}

export interface PlayerProfile {
  readonly guestId: string;
  readonly displayName: string;
  readonly onlineEnabled: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  soundVolume: 0.8,
  reducedMotion: false,
  tutorialCompleted: false,
};

export const DEFAULT_STATS: PlayerStats = {
  personalBest: 0,
  totalGamesPlayed: 0,
  totalLinesCleared: 0,
  highestCombo: 0,
  totalPulsesFired: 0,
};

function generateGuestName(): string {
  const adjectives = ['Cosmic', 'Solar', 'Velvet', 'Crystal', 'Floral', 'Amber', 'Emerald', 'Nova', 'Luminous'];
  const nouns = ['Bloomer', 'Petal', 'Puzzler', 'Prism', 'Spark', 'Gem', 'Voyager', 'Sprout'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${adj}${noun}${num}`;
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
      soundVolume: typeof parsed.soundVolume === 'number' ? Math.max(0, Math.min(1, parsed.soundVolume)) : DEFAULT_SETTINGS.soundVolume,
      reducedMotion: typeof parsed.reducedMotion === 'boolean' ? parsed.reducedMotion : DEFAULT_SETTINGS.reducedMotion,
      tutorialCompleted: typeof parsed.tutorialCompleted === 'boolean' ? parsed.tutorialCompleted : DEFAULT_SETTINGS.tutorialCompleted,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch {
    // Ignore storage quota or disabled storage errors
  }
}

export function loadStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(KEYS.STATS);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw);
    return {
      personalBest: typeof parsed.personalBest === 'number' && parsed.personalBest >= 0 ? parsed.personalBest : 0,
      totalGamesPlayed: typeof parsed.totalGamesPlayed === 'number' ? parsed.totalGamesPlayed : 0,
      totalLinesCleared: typeof parsed.totalLinesCleared === 'number' ? parsed.totalLinesCleared : 0,
      highestCombo: typeof parsed.highestCombo === 'number' ? parsed.highestCombo : 0,
      totalPulsesFired: typeof parsed.totalPulsesFired === 'number' ? parsed.totalPulsesFired : 0,
    };
  } catch {
    return DEFAULT_STATS;
  }
}

export function updateStatsOnRunEnd(runScore: number, linesCleared: number, maxCombo: number, pulsesFired = 0): PlayerStats {
  const current = loadStats();
  const updated: PlayerStats = {
    personalBest: Math.max(current.personalBest, runScore),
    totalGamesPlayed: current.totalGamesPlayed + 1,
    totalLinesCleared: current.totalLinesCleared + linesCleared,
    highestCombo: Math.max(current.highestCombo, maxCombo),
    totalPulsesFired: current.totalPulsesFired + pulsesFired,
  };
  try {
    localStorage.setItem(KEYS.STATS, JSON.stringify(updated));
  } catch {
    // Ignore
  }
  return updated;
}

export function saveActiveRun(state: GameState | null): void {
  try {
    if (!state || state.isGameOver) {
      localStorage.removeItem(KEYS.SAVED_RUN);
    } else {
      localStorage.setItem(KEYS.SAVED_RUN, JSON.stringify(state));
    }
  } catch {
    // Ignore
  }
}

export function loadActiveRun(): GameState | null {
  try {
    const raw = localStorage.getItem(KEYS.SAVED_RUN);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.board) && Array.isArray(parsed.tray) && typeof parsed.score === 'number') {
      return parsed as GameState;
    }
  } catch {
    // If corrupt, clean it up
    clearSavedRun();
  }
  return null;
}

export function clearSavedRun(): void {
  try {
    localStorage.removeItem(KEYS.SAVED_RUN);
  } catch {
    // Ignore
  }
}

export function loadDailyRecord(dateStr: string): DailyRecord | null {
  try {
    const raw = localStorage.getItem(`${KEYS.DAILY}_${dateStr}`);
    if (!raw) return null;
    return JSON.parse(raw) as DailyRecord;
  } catch {
    return null;
  }
}

export function saveDailyRecord(dateStr: string, score: number): void {
  try {
    const prev = loadDailyRecord(dateStr);
    const newBest = prev ? Math.max(prev.score, score) : score;
    const rec: DailyRecord = {
      date: dateStr,
      score: newBest,
      completed: true,
    };
    localStorage.setItem(`${KEYS.DAILY}_${dateStr}`, JSON.stringify(rec));
  } catch {
    // Ignore
  }
}

export function loadPlayerProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(KEYS.PLAYER);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.guestId && parsed.displayName) {
        return parsed;
      }
    }
  } catch {
    // Ignore
  }

  // Create default guest profile
  const guestId = `guest_${Math.random().toString(36).substring(2, 10)}`;
  const profile: PlayerProfile = {
    guestId,
    displayName: generateGuestName(),
    onlineEnabled: false,
  };
  try {
    localStorage.setItem(KEYS.PLAYER, JSON.stringify(profile));
  } catch {
    // Ignore
  }
  return profile;
}

export function savePlayerProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(KEYS.PLAYER, JSON.stringify(profile));
  } catch {
    // Ignore
  }
}
