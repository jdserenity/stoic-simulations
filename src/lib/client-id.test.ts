import { beforeEach, describe, expect, it, vi } from 'vitest';

const store: Record<string, string> = {};

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
  });
  vi.stubGlobal('crypto', { randomUUID: () => '550e8400-e29b-41d4-a716-446655440000' });
});

describe('getClientId', () => {
  it('creates and persists a uuid on first call', async () => {
    const { getClientId } = await import('./client-id');
    expect(getClientId()).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(store['stoic:clientId']).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('returns the stored id on later calls', async () => {
    store['stoic:clientId'] = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';
    const { getClientId } = await import('./client-id');
    expect(getClientId()).toBe('a1b2c3d4-e5f6-4789-a012-3456789abcde');
  });
});
