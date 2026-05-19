import { todayKey } from './daily';
import { api } from './api';

const PREFIX = 'stoic:';
const MIGRATED = `${PREFIX}migrated-v1`;
const DAY_KEY = `${PREFIX}day`;
const ASSIGNED_KEY = `${PREFIX}assigned`;
const COMPLETED_KEY = `${PREFIX}completed`;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function migrateLocalStorageIfNeeded(): Promise<void> {
  if (localStorage.getItem(MIGRATED)) return;

  const dateKey = localStorage.getItem(DAY_KEY);
  const drafts: Array<{
    scope: 'daily' | 'library';
    bucketKey: string;
    exerciseId: string;
    fieldId: string;
    value: string;
  }> = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(`${PREFIX}draft:`)) continue;
    const parts = key.split(':');
    if (parts.length < 6) continue;
    const scope = parts[2] as 'daily' | 'library';
    const bucketKey = parts[3]!;
    const exerciseId = parts[4]!;
    const fieldId = parts[5]!;
    const value = localStorage.getItem(key) ?? '';
    if (!value) continue;
    if (scope !== 'daily' && scope !== 'library') continue;
    drafts.push({ scope, bucketKey, exerciseId, fieldId, value });
  }

  const hasDay = dateKey && dateKey === todayKey();
  const assignedIds = hasDay ? readJson<string[]>(ASSIGNED_KEY, []) : [];
  const completedIds = hasDay ? readJson<string[]>(COMPLETED_KEY, []) : [];

  if ((hasDay && assignedIds.length > 0) || drafts.length > 0) {
    await api.migrate({
      dateKey: dateKey ?? todayKey(),
      assignedIds: assignedIds.length > 0 ? assignedIds : undefined,
      completedIds,
      drafts,
    });
  }

  for (const k of [DAY_KEY, ASSIGNED_KEY, COMPLETED_KEY]) localStorage.removeItem(k);
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith(`${PREFIX}draft:`)) localStorage.removeItem(key);
  }
  localStorage.setItem(MIGRATED, '1');
}
