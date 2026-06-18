import type { DailyMeditationsDto, Meditation } from '../../shared/api-types';
import { drawFromStack } from '../../src/lib/meditations-deck';
import { needsDailyMeditationDraw, shouldPersistDailyAssignment } from '../../src/lib/meditations-daily';
import { isXStatusUrl, resolveMeditationCapture } from '../../src/lib/x-status';
import { ensureUser, error, json, localDateKey, parseIds, userId } from '../_shared';

async function hydrateMeditation(db: D1Database, m: Meditation): Promise<Meditation> {
  if (!isXStatusUrl(m.text)) return m;
  const resolved = await resolveMeditationCapture(m.text, m.url);
  if (resolved.text === m.text && resolved.url === m.url) return m;
  await db.prepare('UPDATE meditations SET text = ?, url = ? WHERE id = ? AND client_id = ?')
    .bind(resolved.text, resolved.url ?? null, m.id, userId()).run();
  return { id: m.id, text: resolved.text, url: resolved.url };
}

async function loadMeditationsByIds(db: D1Database, ids: string[]): Promise<Meditation[]> {
  if (ids.length === 0) return [];
  const rows = await db.prepare(
    'SELECT id, text, url FROM meditations WHERE client_id = ?'
  ).bind(userId()).all<{ id: string; text: string; url: string | null }>();
  const map = new Map(rows.results.map(r => [r.id, { id: r.id, text: r.text, url: r.url || undefined } as Meditation]));
  const items = ids.map((id) => map.get(id)).filter((x): x is Meditation => !!x);
  return Promise.all(items.map((m) => hydrateMeditation(db, m)));
}

async function loadOrCreateStack(db: D1Database): Promise<{ deck: string[]; pos: number }> {
  const row = await db.prepare(
    'SELECT deck, pos FROM meditation_stacks WHERE client_id = ?'
  ).bind(userId()).first<{ deck: string; pos: number }>();
  if (row) return { deck: parseIds(row.deck), pos: row.pos ?? 0 };
  return { deck: [], pos: 0 };
}

async function saveStack(db: D1Database, deck: string[], pos: number): Promise<void> {
  await db.prepare(
    'INSERT OR REPLACE INTO meditation_stacks (client_id, deck, pos) VALUES (?, ?, ?)'
  ).bind(userId(), JSON.stringify(deck), pos).run();
}

async function loadDailyMeds(db: D1Database, dateKey: string): Promise<string[] | null> {
  const row = await db.prepare(
    'SELECT item_ids FROM meditation_days WHERE client_id = ? AND date_key = ?'
  ).bind(userId(), dateKey).first<{ item_ids: string }>();
  if (!row) return null;
  const ids = parseIds(row.item_ids);
  return ids.length > 0 ? ids : null;
}

async function saveDailyMeds(db: D1Database, dateKey: string, ids: string[]): Promise<void> {
  await db.prepare(
    'INSERT OR REPLACE INTO meditation_days (client_id, date_key, item_ids) VALUES (?, ?, ?)'
  ).bind(userId(), dateKey, JSON.stringify(ids)).run();
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  await ensureUser(context.env.DB);
  const dateKey = localDateKey(context.request);
  const allRes = await context.env.DB.prepare('SELECT id FROM meditations WHERE client_id = ?').bind(userId()).all<{ id: string }>();
  const allIds = allRes.results.map((r) => r.id);
  let assigned = await loadDailyMeds(context.env.DB, dateKey);
  if (needsDailyMeditationDraw(assigned)) {
    const stack = await loadOrCreateStack(context.env.DB);
    const { drawn, newDeck, newPos } = drawFromStack(allIds, stack.deck, stack.pos, 3);
    await saveStack(context.env.DB, newDeck, newPos);
    assigned = drawn;
    if (shouldPersistDailyAssignment(assigned)) await saveDailyMeds(context.env.DB, dateKey, assigned);
  }
  const items = await loadMeditationsByIds(context.env.DB, assigned ?? []);
  return json<DailyMeditationsDto>({ dateKey, items });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: { text?: string; url?: string };
  try {
    body = await context.request.json() as { text?: string; url?: string };
  } catch {
    return error('Invalid JSON body', 400);
  }
  const text = (body.text || '').trim();
  if (!text) return error('text required', 400);
  const url = body.url ? body.url.trim() : undefined;
  const resolved = await resolveMeditationCapture(text, url);
  const id = (globalThis as any).crypto?.randomUUID?.() || ('m' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
  await ensureUser(context.env.DB);
  await context.env.DB.prepare(
    'INSERT INTO meditations (id, client_id, text, url) VALUES (?, ?, ?, ?)'
  ).bind(id, userId(), resolved.text, resolved.url ?? null).run();
  return json<Meditation>({ id, text: resolved.text, url: resolved.url });
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  let body: { id?: string };
  try {
    body = await context.request.json() as { id?: string };
  } catch {
    return error('Invalid JSON body', 400);
  }
  const id = (body.id || '').trim();
  if (!id) return error('id required', 400);
  await ensureUser(context.env.DB);
  const uid = userId();
  await context.env.DB.prepare('DELETE FROM meditations WHERE id = ? AND client_id = ?').bind(id, uid).run();
  const stackRow = await context.env.DB.prepare('SELECT deck, pos FROM meditation_stacks WHERE client_id = ?').bind(uid).first<{ deck: string; pos: number }>();
  if (stackRow) {
    let d = parseIds(stackRow.deck);
    const before = d.length;
    d = d.filter((x) => x !== id);
    let p = stackRow.pos || 0;
    if (d.length < before && p > d.length) p = d.length;
    await context.env.DB.prepare('UPDATE meditation_stacks SET deck = ?, pos = ? WHERE client_id = ?').bind(JSON.stringify(d), p, uid).run();
  }
  return json({ ok: true });
};
