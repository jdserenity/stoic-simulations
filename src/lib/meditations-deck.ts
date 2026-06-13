/**
 * Pure deck for meditations: shuffle current set on exhaust, draw without replacement.
 * New items (added after last reshuffle) only appear on next full cycle.
 */
export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function drawFromStack(allIds: string[], deck: string[], pos: number, count = 3): { drawn: string[]; newDeck: string[]; newPos: number } {
  let d = deck.slice();
  let p = pos;
  if (p >= d.length || d.length === 0) {
    if (allIds.length === 0) return { drawn: [], newDeck: [], newPos: 0 };
    d = shuffle(allIds);
    p = 0;
  }
  const n = Math.min(count, d.length - p);
  const drawn = d.slice(p, p + n);
  p += n;
  return { drawn, newDeck: d, newPos: p };
}
