import { DAILY_COUNT } from '../../exercises';

export { DAILY_COUNT };

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Deterministic 0..1 from a string seed. */
export function hashUnit(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

function mulberry32(a: number): () => number {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick `count` distinct ids from `pool` deterministically for `dateKey`. */
export function pickDailyIds(pool: string[], dateKey: string, count = DAILY_COUNT): string[] {
  if (pool.length === 0) return [];
  const n = Math.min(count, pool.length);
  const seed = Math.floor(hashUnit(`stoic:${dateKey}`) * 2147483647);
  const rand = mulberry32(seed);
  const indices = pool.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = indices[i]; indices[i] = indices[j]; indices[j] = tmp;
  }
  return indices.slice(0, n).map((i) => pool[i]);
}

export function isDailyComplete(assigned: string[], completed: string[]): boolean {
  if (assigned.length === 0) return false;
  const done = new Set(completed);
  return assigned.every((id) => done.has(id));
}

export function nextIncompleteId(assigned: string[], completed: string[]): string | null {
  const done = new Set(completed);
  return assigned.find((id) => !done.has(id)) ?? null;
}
