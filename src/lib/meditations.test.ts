import { describe, it, expect } from 'vitest';
import { drawFromStack } from './meditations-deck';

describe('meditations drawFromStack', () => {
  it('draws requested count from deck', () => {
    const all = ['1', '2', '3', '4', '5'];
    const res = drawFromStack(all, all, 0, 3);
    expect(res.drawn.length).toBe(3);
    expect(res.newPos).toBe(3);
    expect(res.newDeck.length).toBe(5);
  });

  it('exhausts and reshuffles using current allIds when pos at end', () => {
    const all = ['a', 'b'];
    const res1 = drawFromStack(all, ['a', 'b'], 0, 3);
    expect(res1.drawn.length).toBe(2);
    const res2 = drawFromStack(all, res1.newDeck, res1.newPos, 3);
    expect(res2.drawn.length).toBe(2);
    expect(res2.newPos).toBe(2);
  });

  it('returns empty for no items', () => {
    const res = drawFromStack([], [], 0, 3);
    expect(res.drawn).toEqual([]);
    expect(res.newPos).toBe(0);
  });

  it('draws partial when fewer than count remain', () => {
    const all = ['x', 'y', 'z'];
    const res = drawFromStack(all, all, 1, 3);
    expect(res.drawn.length).toBe(2);
    expect(res.newPos).toBe(3);
  });
});
