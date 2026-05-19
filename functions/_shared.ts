import type { DayStateDto } from '../shared/api-types';

const CLIENT_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export function error(message: string, status: number): Response {
  return json({ error: message }, status);
}

export function clientId(request: Request): string | null {
  const id = request.headers.get('X-Client-Id')?.trim() ?? '';
  return CLIENT_RE.test(id) ? id : null;
}

export async function ensureClient(db: D1Database, id: string): Promise<void> {
  await db.prepare('INSERT OR IGNORE INTO clients (id) VALUES (?)').bind(id).run();
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
