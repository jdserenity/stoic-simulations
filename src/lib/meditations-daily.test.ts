import { describe, expect, it } from 'vitest';
import { needsDailyMeditationDraw, shouldPersistDailyAssignment } from './meditations-daily';

describe('needsDailyMeditationDraw', () => {
  it('draws when no assignment row', () => {
    expect(needsDailyMeditationDraw(null)).toBe(true);
  });

  it('skips when today already has items', () => {
    expect(needsDailyMeditationDraw(['a'])).toBe(false);
  });
});

describe('shouldPersistDailyAssignment', () => {
  it('persists only non-empty assignments', () => {
    expect(shouldPersistDailyAssignment(['a'])).toBe(true);
    expect(shouldPersistDailyAssignment([])).toBe(false);
  });
});
