import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SW = resolve(import.meta.dirname, '../public/sw.js');

describe('service worker', () => {
  it('does not intercept or cache /api requests', () => {
    const src = readFileSync(SW, 'utf8');
    expect(src).toMatch(/function isApiRequest/);
    expect(src).toMatch(/if \(isApiRequest\(url\)\) return/);
  });
});
