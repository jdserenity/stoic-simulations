import { beforeEach, describe, expect, it, vi } from 'vitest';
import { copyText } from './copy-text';

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('copyText', () => {
  it('uses clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    expect(await copyText('abc')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('abc');
  });

  it('returns false when clipboard throws', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    vi.stubGlobal('document', { createElement: () => { throw new Error('no dom'); } });
    expect(await copyText('abc')).toBe(false);
  });
});
