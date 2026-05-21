import { todayKey } from './daily';

const KEY = 'stoic:library-bonus';

type Stored = { dateKey: string; count: number };

function read(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Stored;
    if (typeof v.dateKey !== 'string' || typeof v.count !== 'number') return null;
    return v;
  } catch {
    return null;
  }
}

export function getLibraryBonus(dateKey = todayKey()): number {
  const v = read();
  if (!v || v.dateKey !== dateKey) return 0;
  return v.count > 0 ? v.count : 0;
}

export function recordLibraryCompletion(dateKey = todayKey()): number {
  const cur = getLibraryBonus(dateKey);
  const count = cur + 1;
  localStorage.setItem(KEY, JSON.stringify({ dateKey, count }));
  return count;
}

export function displayDone(completedCount: number, dateKey: string): number {
  return completedCount + getLibraryBonus(dateKey);
}
