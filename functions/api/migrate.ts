import { clientId, ensureClient, error, json, parseIds } from '../_shared';

type MigrateBody = {
  dateKey?: string;
  assignedIds?: string[];
  completedIds?: string[];
  drafts?: Array<{
    scope: 'daily' | 'library';
    bucketKey: string;
    exerciseId: string;
    fieldId: string;
    value: string;
  }>;
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const cid = clientId(context.request);
  if (!cid) return error('Missing or invalid X-Client-Id', 400);

  let body: MigrateBody;
  try {
    body = await context.request.json() as MigrateBody;
  } catch {
    return error('Invalid JSON body', 400);
  }

  const dateKey = body.dateKey?.trim();
  if (!dateKey) return error('dateKey required', 400);

  await ensureClient(context.env.DB, cid);
  const db = context.env.DB;

  const existing = await db.prepare(
    'SELECT 1 FROM day_sessions WHERE client_id = ? AND date_key = ?',
  ).bind(cid, dateKey).first();

  if (!existing && Array.isArray(body.assignedIds) && body.assignedIds.length > 0) {
    await db.prepare(
      'INSERT INTO day_sessions (client_id, date_key, assigned_ids, completed_ids) VALUES (?, ?, ?, ?)',
    ).bind(
      cid,
      dateKey,
      JSON.stringify(body.assignedIds),
      JSON.stringify(body.completedIds ?? []),
    ).run();
  }

  for (const d of body.drafts ?? []) {
    if (!d.value || !d.exerciseId || !d.fieldId) continue;
    if (d.scope !== 'daily' && d.scope !== 'library') continue;
    await db.prepare(
      `INSERT INTO drafts (client_id, scope, bucket_key, exercise_id, field_id, value, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(client_id, scope, bucket_key, exercise_id, field_id)
       DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    ).bind(cid, d.scope, d.bucketKey, d.exerciseId, d.fieldId, d.value).run();
  }

  return json({ ok: true });
};
