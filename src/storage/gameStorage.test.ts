import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
  loadSettings,
  saveSettings,
  loadStats,
  updateStatsOnRunEnd,
  loadPlayerProfile,
  savePlayerProfile,
} from './gameStorage';

// Mock localStorage in Node test environment
const mockStorage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => mockStorage.get(k) ?? null,
  setItem: (k: string, v: string) => mockStorage.set(k, v),
  removeItem: (k: string) => mockStorage.delete(k),
  clear: () => mockStorage.clear(),
};

test('Storage: fallback to defaults on empty storage', () => {
  mockStorage.clear();
  const settings = loadSettings();
  assert.equal(settings.soundEnabled, true);
  assert.equal(settings.soundVolume, 0.8);

  const stats = loadStats();
  assert.equal(stats.personalBest, 0);
  assert.equal(stats.totalGamesPlayed, 0);
});

test('Storage: resilient recovery from corrupted JSON', () => {
  mockStorage.set('gridbloom_v1_settings', '{{broken-json');
  const recoveredSettings = loadSettings();
  assert.deepEqual(recoveredSettings, DEFAULT_SETTINGS);

  mockStorage.set('gridbloom_v1_stats', 'not a json string');
  const recoveredStats = loadStats();
  assert.deepEqual(recoveredStats, DEFAULT_STATS);
});

test('Storage: updateStatsOnRunEnd updates personal best and counters', () => {
  mockStorage.clear();
  const s1 = updateStatsOnRunEnd(150, 4, 2, 1);
  assert.equal(s1.personalBest, 150);
  assert.equal(s1.totalGamesPlayed, 1);
  assert.equal(s1.totalLinesCleared, 4);
  assert.equal(s1.highestCombo, 2);
  assert.equal(s1.totalPulsesFired, 1);

  // Lower score should not decrease personal best
  const s2 = updateStatsOnRunEnd(80, 2, 1, 0);
  assert.equal(s2.personalBest, 150);
  assert.equal(s2.totalGamesPlayed, 2);
  assert.equal(s2.totalLinesCleared, 6);
});

test('Storage: player profile generation and updates', () => {
  mockStorage.clear();
  const profile = loadPlayerProfile();
  assert.ok(profile.guestId.startsWith('guest_'));
  assert.ok(profile.displayName.length > 3);
  assert.equal(profile.onlineEnabled, false);

  savePlayerProfile({ ...profile, displayName: 'BloomMaster' });
  const updated = loadPlayerProfile();
  assert.equal(updated.displayName, 'BloomMaster');
});
