/**
 * GridBloom - Daily Challenge Engine
 * Provides deterministic seeds and date keys based on UTC day.
 */

import { stringToSeed, createMulberry32, RandomSource } from './random';
import { GameState, createInitialGameState } from './rules';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createDailyRandomSource(dateStr: string = getTodayDateString()): RandomSource {
  const seed = stringToSeed(`gridbloom-daily-${dateStr}`);
  return createMulberry32(seed);
}

export function createDailyGameState(dateStr: string = getTodayDateString()): {
  dateStr: string;
  state: GameState;
  rng: RandomSource;
} {
  const rng = createDailyRandomSource(dateStr);
  const state = createInitialGameState(rng);
  return { dateStr, state, rng };
}
