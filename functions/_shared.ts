import type { DayStateDto } from '../shared/api-types';
import { todayKey } from '../src/lib/daily';

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Single-user DB: all rows use this client_id. */
export const USER_ID = 'user';

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export function error(message: string, status: number): Response {
  return json({ error: message }, status);
}

export function userId(): string {
  return USER_ID;
}

/** Device-local calendar day (YYYY-MM-DD); falls back to UTC when header missing/invalid. */
export function localDateKey(request: Request): string {
  const header = request.headers.get('X-Local-Date')?.trim() ?? '';
  return DATE_KEY_RE.test(header) ? header : todayKey();
}

export async function ensureUser(db: D1Database): Promise<void> {
  await db.prepare('INSERT OR IGNORE INTO clients (id) VALUES (?)').bind(USER_ID).run();
}

export function parseIds(raw: string): string[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function toDayDto(
  dateKey: string,
  assignedIds: string[],
  completedIds: string[],
): DayStateDto {
  const done = new Set(completedIds);
  const dailyComplete = assignedIds.length > 0 && assignedIds.every((id) => done.has(id));
  const nextId = assignedIds.find((id) => !done.has(id)) ?? null;
  return { dateKey, assignedIds, completedIds, dailyComplete, nextId };
}
