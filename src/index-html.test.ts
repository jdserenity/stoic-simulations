import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const INDEX = resolve(import.meta.dirname, '../index.html');

function viewportContent(): string {
  const html = readFileSync(INDEX, 'utf8');
  const m = html.match(/name="viewport"\s+content="([^"]+)"/);
  expect(m).toBeTruthy();
  return m![1];
}

describe('index.html viewport', () => {
  it('disables pinch and user scaling for app-like PWA behavior', () => {
    const content = viewportContent();
    expect(content).toMatch(/user-scalable=no/i);
    expect(content).toMatch(/maximum-scale=1/i);
    expect(content).toMatch(/minimum-scale=1/i);
  });
});
