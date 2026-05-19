import { describe, expect, it } from 'vitest';
import { clientId, parseIds, toDayDto } from './_shared';

describe('clientId', () => {
  it('accepts valid uuid', () => {
    const req = new Request('http://x', {
      headers: { 'X-Client-Id': '550e8400-e29b-41d4-a716-446655440000' },
    });
    expect(clientId(req)).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('rejects invalid id', () => {
    const req = new Request('http://x', { headers: { 'X-Client-Id': 'bad' } });
    expect(clientId(req)).toBeNull();
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
