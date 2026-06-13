import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const MANIFEST = resolve(import.meta.dirname, '../public/manifest.webmanifest');

describe('manifest.webmanifest', () => {
  it('does not declare share_target (unsupported on iOS)', () => {
    const json = JSON.parse(readFileSync(MANIFEST, 'utf8')) as Record<string, unknown>;
    expect(json.share_target).toBeUndefined();
  });
});
