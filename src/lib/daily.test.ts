import { describe, expect, it } from 'vitest';
import {
  isDailyComplete,
  nextIncompleteId,
  pickDailyIds,
  todayKey,
} from './daily';

const POOL = ['a', 'b', 'c', 'd', 'e'];

describe('todayKey', () => {
  it('formats as YYYY-MM-DD', () => {
    expect(todayKey(new Date(2026, 4, 19))).toBe('2026-05-19');
  });
});

describe('pickDailyIds', () => {
  it('is deterministic for the same date', () => {
    const one = pickDailyIds(POOL, '2026-05-19', 2);
    const two = pickDailyIds(POOL, '2026-05-19', 2);
    expect(one).toEqual(two);
  });

  it('differs across dates usually', () => {
    const a = pickDailyIds(POOL, '2026-05-19', 2).join();
    const b = pickDailyIds(POOL, '2026-05-20', 2).join();
    expect(a).not.toBe(b);
  });

  it('returns distinct ids capped at pool size', () => {
    const ids = pickDailyIds(POOL, '2026-05-19', 10);
    expect(ids.length).toBe(POOL.length);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('progress', () => {
  it('detects daily completion', () => {
    expect(isDailyComplete(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(isDailyComplete(['a', 'b'], ['a'])).toBe(false);
  });

  it('finds next incomplete', () => {
    expect(nextIncompleteId(['a', 'b'], ['a'])).toBe('b');
    expect(nextIncompleteId(['a', 'b'], ['a', 'b'])).toBe(null);
  });
});
