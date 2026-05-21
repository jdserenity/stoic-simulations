import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { displayDone, getLibraryBonus, recordLibraryCompletion } from './library-bonus';

const store: Record<string, string> = {};

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('library bonus', () => {
  it('starts at zero for a date', () => {
    expect(getLibraryBonus('2026-05-20')).toBe(0);
    expect(displayDone(2, '2026-05-20')).toBe(2);
  });

  it('increments per library completion for the same day', () => {
    expect(recordLibraryCompletion('2026-05-20')).toBe(1);
    expect(recordLibraryCompletion('2026-05-20')).toBe(2);
    expect(displayDone(2, '2026-05-20')).toBe(4);
  });

  it('resets when the stored date changes', () => {
    recordLibraryCompletion('2026-05-19');
    recordLibraryCompletion('2026-05-19');
    expect(getLibraryBonus('2026-05-20')).toBe(0);
    expect(displayDone(0, '2026-05-20')).toBe(0);
  });
});
