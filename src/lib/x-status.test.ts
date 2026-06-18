import { describe, expect, it, vi } from 'vitest';
import {
  canonicalXStatusUrl,
  isXStatusUrl,
  resolveMeditationCapture,
  tweetTextFromOembedHtml,
} from './x-status';

describe('isXStatusUrl', () => {
  it('matches x and twitter status urls', () => {
    expect(isXStatusUrl('https://x.com/foo/status/123?s=12')).toBe(true);
    expect(isXStatusUrl('https://twitter.com/foo/status/456')).toBe(true);
    expect(isXStatusUrl('hello')).toBe(false);
  });
});

describe('canonicalXStatusUrl', () => {
  it('normalizes x.com and strips query', () => {
    expect(canonicalXStatusUrl('https://x.com/a/status/99?s=12')).toBe('https://twitter.com/a/status/99');
  });
});

describe('tweetTextFromOembedHtml', () => {
  it('extracts paragraph text from blockquote', () => {
    const html = '<blockquote class="twitter-tweet"><p lang="en">Bring back marble statues.</p>&mdash; J.D.</blockquote>';
    expect(tweetTextFromOembedHtml(html)).toBe('Bring back marble statues.');
  });
});

describe('resolveMeditationCapture', () => {
  it('leaves non-url text alone', async () => {
    const out = await resolveMeditationCapture('A line worth keeping', undefined, vi.fn());
    expect(out).toEqual({ text: 'A line worth keeping', url: undefined });
  });

  it('resolves x status url via oembed', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ html: '<blockquote><p>Tweet body</p></blockquote>' }),
    });
    const out = await resolveMeditationCapture('https://x.com/a/status/1?s=1', undefined, fetchFn);
    expect(out.text).toBe('Tweet body');
    expect(out.url).toBe('https://twitter.com/a/status/1');
  });

  it('falls back to url when oembed fails', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false });
    const out = await resolveMeditationCapture('https://x.com/a/status/1', undefined, fetchFn);
    expect(out.text).toBe('https://x.com/a/status/1');
    expect(out.url).toBe('https://twitter.com/a/status/1');
  });
});
