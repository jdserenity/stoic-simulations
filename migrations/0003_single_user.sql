-- Consolidate all rows under client_id 'user'. Orphan client rows may remain; harmless.

INSERT OR IGNORE INTO clients (id) VALUES ('user');

UPDATE meditations SET client_id = 'user';

INSERT OR REPLACE INTO meditation_stacks (client_id, deck, pos)
SELECT 'user', deck, pos FROM meditation_stacks ORDER BY length(deck) DESC LIMIT 1;
DELETE FROM meditation_stacks WHERE client_id != 'user';

DELETE FROM meditation_days WHERE rowid IN (
  SELECT md.rowid FROM meditation_days md
  WHERE EXISTS (
    SELECT 1 FROM meditation_days md2
    WHERE md2.date_key = md.date_key AND length(md2.item_ids) > length(md.item_ids)
  )
);
DELETE FROM meditation_days WHERE rowid NOT IN (
  SELECT MIN(rowid) FROM meditation_days GROUP BY date_key
);
UPDATE meditation_days SET client_id = 'user';

DELETE FROM day_sessions WHERE rowid IN (
  SELECT ds.rowid FROM day_sessions ds
  WHERE EXISTS (
    SELECT 1 FROM day_sessions ds2
    WHERE ds2.date_key = ds.date_key
      AND (length(ds2.completed_ids) > length(ds.completed_ids)
        OR (length(ds2.completed_ids) = length(ds.completed_ids) AND length(ds2.assigned_ids) > length(ds.assigned_ids)))
  )
);
DELETE FROM day_sessions WHERE rowid NOT IN (
  SELECT MIN(rowid) FROM day_sessions GROUP BY date_key
);
UPDATE day_sessions SET client_id = 'user';

DELETE FROM drafts WHERE rowid IN (
  SELECT dr.rowid FROM drafts dr
  WHERE EXISTS (
    SELECT 1 FROM drafts dr2
    WHERE dr2.scope = dr.scope AND dr2.bucket_key = dr.bucket_key
      AND dr2.exercise_id = dr.exercise_id AND dr2.field_id = dr.field_id
      AND length(dr2.value) > length(dr.value)
  )
);
DELETE FROM drafts WHERE rowid NOT IN (
  SELECT MIN(rowid) FROM drafts GROUP BY scope, bucket_key, exercise_id, field_id
);
UPDATE drafts SET client_id = 'user';
