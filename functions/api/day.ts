import { DAILY_COUNT, EXERCISES } from '../../exercises';
import { pickDailyIds, todayKey } from '../../src/lib/daily';
import type { DayStateDto } from '../../shared/api-types';
import { clientId, ensureClient, error, json, parseIds, toDayDto } from '../_shared';

const POOL = EXERCISES.map((e) => e.id);

async function loadDay(db: D1Database, cid: string, dateKey: string): Promise<DayStateDto> {
  const row = await db.prepare(
    'SELECT assigned_ids, completed_ids FROM day_sessions WHERE client_id = ? AND date_key = ?',
  ).bind(cid, dateKey).first<{ assigned_ids: string; completed_ids: string }>();

  if (!row) {
    const assignedIds = pickDailyIds(POOL, dateKey, DAILY_COUNT);
    const assignedJson = JSON.stringify(assignedIds);
    const completedJson = '[]';
    await db.prepare(
      'INSERT INTO day_sessions (client_id, date_key, assigned_ids, completed_ids) VALUES (?, ?, ?, ?)',
    ).bind(cid, dateKey, assignedJson, completedJson).run();
    return toDayDto(dateKey, assignedIds, []);
  }

  return toDayDto(dateKey, parseIds(row.assigned_ids), parseIds(row.completed_ids));
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const cid = clientId(context.request);
  if (!cid) return error('Missing or invalid X-Client-Id', 400);
  await ensureClient(context.env.DB, cid);
  const state = await loadDay(context.env.DB, cid, todayKey());
  return json(state);
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const cid = clientId(context.request);
  if (!cid) return error('Missing or invalid X-Client-Id', 400);

  let body: { exerciseId?: string };
  try {
    body = await context.request.json() as { exerciseId?: string };
  } catch {
    return error('Invalid JSON body', 400);
  }

  const exerciseId = body.exerciseId?.trim();
  if (!exerciseId) return error('exerciseId required', 400);

  await ensureClient(context.env.DB, cid);
  const dateKey = todayKey();
  const state = await loadDay(context.env.DB, cid, dateKey);

  if (!state.assignedIds.includes(exerciseId)) return json(state);
  if (state.completedIds.includes(exerciseId)) return json(state);

  const completedIds = [...state.completedIds, exerciseId];
  await context.env.DB.prepare(
    'UPDATE day_sessions SET completed_ids = ? WHERE client_id = ? AND date_key = ?',
  ).bind(JSON.stringify(completedIds), cid, dateKey).run();

  return json(toDayDto(dateKey, state.assignedIds, completedIds));
};
