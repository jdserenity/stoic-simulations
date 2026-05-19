import { todayKey } from '../../src/lib/daily';
import type { DraftDto } from '../../shared/api-types';
import { clientId, ensureClient, error, json } from '../_shared';

function bucketKey(scope: 'daily' | 'library', dateKey: string): string {
  return scope === 'daily' ? dateKey : 'library';
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const cid = clientId(context.request);
  if (!cid) return error('Missing or invalid X-Client-Id', 400);

  const url = new URL(context.request.url);
  const exerciseId = url.searchParams.get('exerciseId')?.trim();
  const scope = url.searchParams.get('scope');
  if (!exerciseId || (scope !== 'daily' && scope !== 'library')) {
    return error('exerciseId and scope (daily|library) required', 400);
  }

  await ensureClient(context.env.DB, cid);
  const bucket = bucketKey(scope, todayKey());
  const { results } = await context.env.DB.prepare(
    'SELECT field_id, value FROM drafts WHERE client_id = ? AND scope = ? AND bucket_key = ? AND exercise_id = ?',
  ).bind(cid, scope, bucket, exerciseId).all<{ field_id: string; value: string }>();

  const fields: Record<string, string> = {};
  for (const row of results ?? []) fields[row.field_id] = row.value;
  return json({ exerciseId, scope, fields });
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const cid = clientId(context.request);
  if (!cid) return error('Missing or invalid X-Client-Id', 400);

  let body: DraftDto;
  try {
    body = await context.request.json() as DraftDto;
  } catch {
    return error('Invalid JSON body', 400);
  }

  const { exerciseId, fieldId, scope, value } = body;
  if (!exerciseId || !fieldId || (scope !== 'daily' && scope !== 'library')) {
    return error('exerciseId, fieldId, scope required', 400);
  }

  await ensureClient(context.env.DB, cid);
  const bucket = bucketKey(scope, todayKey());

  if (!value) {
    await context.env.DB.prepare(
      'DELETE FROM drafts WHERE client_id = ? AND scope = ? AND bucket_key = ? AND exercise_id = ? AND field_id = ?',
    ).bind(cid, scope, bucket, exerciseId, fieldId).run();
    return json({ ok: true });
  }

  await context.env.DB.prepare(
    `INSERT INTO drafts (client_id, scope, bucket_key, exercise_id, field_id, value, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(client_id, scope, bucket_key, exercise_id, field_id)
     DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).bind(cid, scope, bucket, exerciseId, fieldId, value).run();

  return json({ ok: true });
};
