/**
 * GridBloom - Seeded Deterministic PRNG
 * Uses Mulberry32 algorithm for fast, high-quality, reproducible pseudo-random numbers.
 */

export interface RandomSource {
  next(): number;               // [0, 1)
  nextInt(min: number, max: number): number; // inclusive min, inclusive max
  pick<T>(items: readonly T[]): T;
  weightedPick<T extends { weight: number }>(items: readonly T[]): T;
}

export function createMulberry32(seed: number): RandomSource {
  let s = seed >>> 0;

  function next(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(min: number, max: number): number {
    const f = next();
    return Math.floor(f * (max - min + 1)) + min;
  }

  function pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    const idx = nextInt(0, items.length - 1);
    return items[idx];
  }

  function weightedPick<T extends { weight: number }>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    const totalWeight = items.reduce((acc, it) => acc + Math.max(0, it.weight), 0);
    if (totalWeight <= 0) {
      return pick(items);
    }
    let threshold = next() * totalWeight;
    for (const item of items) {
      threshold -= Math.max(0, item.weight);
      if (threshold <= 0) {
        return item;
      }
    }
    return items[items.length - 1];
  }

  return { next, nextInt, pick, weightedPick };
}

/**
 * Hash string to 32-bit unsigned integer (e.g. for "2026-10-28")
 */
export function stringToSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
  }
  return h;
}
