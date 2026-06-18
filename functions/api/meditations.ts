import type { DailyMeditationsDto, Meditation } from '../../shared/api-types';
import { clientId, ensureClient, error, json, localDateKey, parseIds } from '../_shared';
import { drawFromStack } from '../../src/lib/meditations-deck';
import { needsDailyMeditationDraw, shouldPersistDailyAssignment } from '../../src/lib/meditations-daily';

async function loadMeditationsByIds(db: D1Database, cid: string, ids: string[]): Promise<Meditation[]> {
  if (ids.length === 0) return [];
  const rows = await db.prepare(
    'SELECT id, text, url FROM meditations WHERE client_id = ?'
  ).bind(cid).all<{ id: string; text: string; url: string | null }>();
  const map = new Map(rows.results.map(r => [r.id, { id: r.id, text: r.text, url: r.url || undefined } as Meditation]));
  return ids.map((id) => map.get(id)).filter((x): x is Meditation => !!x);
}

async function loadOrCreateStack(db: D1Database, cid: string): Promise<{ deck: string[]; pos: number }> {
  const row = await db.prepare(
    'SELECT deck, pos FROM meditation_stacks WHERE client_id = ?'
  ).bind(cid).first<{ deck: string; pos: number }>();
  if (row) return { deck: parseIds(row.deck), pos: row.pos ?? 0 };
  return { deck: [], pos: 0 };
}

async function saveStack(db: D1Database, cid: string, deck: string[], pos: number): Promise<void> {
  await db.prepare(
    'INSERT OR REPLACE INTO meditation_stacks (client_id, deck, pos) VALUES (?, ?, ?)'
  ).bind(cid, JSON.stringify(deck), pos).run();
}

async function loadDailyMeds(db: D1Database, cid: string, dateKey: string): Promise<string[] | null> {
  const row = await db.prepare(
    'SELECT item_ids FROM meditation_days WHERE client_id = ? AND date_key = ?'
  ).bind(cid, dateKey).first<{ item_ids: string }>();
  if (!row) return null;
  const ids = parseIds(row.item_ids);
  return ids.length > 0 ? ids : null;
}

async function saveDailyMeds(db: D1Database, cid: string, dateKey: string, ids: string[]): Promise<void> {
  await db.prepare(
    'INSERT OR REPLACE INTO meditation_days (client_id, date_key, item_ids) VALUES (?, ?, ?)'
  ).bind(cid, dateKey, JSON.stringify(ids)).run();
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const cid = clientId(context.request);
  if (!cid) return error('Missing or invalid X-Client-Id', 400);
  await ensureClient(context.env.DB, cid);
  const dateKey = localDateKey(context.request);
  const allRes = await context.env.DB.prepare('SELECT id FROM meditations WHERE client_id = ?').bind(cid).all<{ id: string }>();
  const allIds = allRes.results.map((r) => r.id);
  let assigned = await loadDailyMeds(context.env.DB, cid, dateKey);
  if (needsDailyMeditationDraw(assigned)) {
    const stack = await loadOrCreateStack(context.env.DB, cid);
    const { drawn, newDeck, newPos } = drawFromStack(allIds, stack.deck, stack.pos, 3);
    await saveStack(context.env.DB, cid, newDeck, newPos);
    assigned = drawn;
    if (shouldPersistDailyAssignment(assigned)) await saveDailyMeds(context.env.DB, cid, dateKey, assigned);
  }
  const items = await loadMeditationsByIds(context.env.DB, cid, assigned ?? []);
  return json<DailyMeditationsDto>({ dateKey, items });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const cid = clientId(context.request);
  if (!cid) return error('Missing or invalid X-Client-Id', 400);
  let body: { text?: string; url?: string };
  try {
    body = await context.request.json() as { text?: string; url?: string };
  } catch {
    return error('Invalid JSON body', 400);
  }
  const text = (body.text || '').trim();
  if (!text) return error('text required', 400);
  const url = body.url ? body.url.trim() : undefined;
  const id = (globalThis as any).crypto?.randomUUID?.() || ('m' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
  await ensureClient(context.env.DB, cid);
  await context.env.DB.prepare(
    'INSERT INTO meditations (id, client_id, text, url) VALUES (?, ?, ?, ?)'
  ).bind(id, cid, text, url ?? null).run();
  return json<Meditation>({ id, text, url });
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const cid = clientId(context.request);
  if (!cid) return error('Missing or invalid X-Client-Id', 400);
  let body: { id?: string };
  try {
    body = await context.request.json() as { id?: string };
  } catch {
    return error('Invalid JSON body', 400);
  }
  const id = (body.id || '').trim();
  if (!id) return error('id required', 400);
  await ensureClient(context.env.DB, cid);
  await context.env.DB.prepare('DELETE FROM meditations WHERE id = ? AND client_id = ?').bind(id, cid).run();
  const stackRow = await context.env.DB.prepare('SELECT deck, pos FROM meditation_stacks WHERE client_id = ?').bind(cid).first<{ deck: string; pos: number }>();
  if (stackRow) {
    let d = parseIds(stackRow.deck);
    const before = d.length;
    d = d.filter((x) => x !== id);
    let p = stackRow.pos || 0;
    if (d.length < before && p > d.length) p = d.length;
    await context.env.DB.prepare('UPDATE meditation_stacks SET deck = ?, pos = ? WHERE client_id = ?').bind(JSON.stringify(d), p, cid).run();
  }
  return json({ ok: true });
};
