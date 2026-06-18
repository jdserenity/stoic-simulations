import { describe, expect, it } from 'vitest';
import { USER_ID, localDateKey, parseIds, toDayDto, userId } from './_shared';

describe('userId', () => {
  it('returns the single-user id', () => {
    expect(userId()).toBe(USER_ID);
    expect(USER_ID).toBe('user');
  });
});

describe('localDateKey', () => {
  it('uses X-Local-Date when valid', () => {
    const req = new Request('http://x', { headers: { 'X-Local-Date': '2026-05-20' } });
    expect(localDateKey(req)).toBe('2026-05-20');
  });

  it('falls back when header missing or invalid', () => {
    expect(localDateKey(new Request('http://x'))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const bad = new Request('http://x', { headers: { 'X-Local-Date': 'yesterday' } });
    expect(localDateKey(bad)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('toDayDto', () => {
  it('computes next and completion', () => {
    const open = toDayDto('2026-05-19', ['a', 'b'], ['a']);
    expect(open.nextId).toBe('b');
    expect(open.dailyComplete).toBe(false);
    const done = toDayDto('2026-05-19', ['a', 'b'], ['a', 'b']);
    expect(done.dailyComplete).toBe(true);
    expect(done.nextId).toBeNull();
  });
});

describe('parseIds', () => {
  it('parses json array', () => {
    expect(parseIds('["x","y"]')).toEqual(['x', 'y']);
  });
});
