import { describe, expect, it } from 'vitest';
import { needsDailyMeditationDraw, shouldPersistDailyAssignment } from './meditations-daily';

describe('needsDailyMeditationDraw', () => {
  it('draws when no row exists', () => {
    expect(needsDailyMeditationDraw(null, 0)).toBe(true);
    expect(needsDailyMeditationDraw(null, 2)).toBe(true);
  });

  it('skips when today already has items', () => {
    expect(needsDailyMeditationDraw(['a'], 5)).toBe(false);
  });

  it('redraws stale empty assignment when pool gained items', () => {
    expect(needsDailyMeditationDraw([], 2)).toBe(true);
  });

  it('keeps empty day when pool is still empty', () => {
    expect(needsDailyMeditationDraw([], 0)).toBe(false);
  });
});

describe('shouldPersistDailyAssignment', () => {
  it('persists only non-empty assignments', () => {
    expect(shouldPersistDailyAssignment(['a'])).toBe(true);
    expect(shouldPersistDailyAssignment([])).toBe(false);
  });
});
