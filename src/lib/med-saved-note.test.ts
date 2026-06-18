import { describe, expect, it } from 'vitest';
import { medSavedMessage } from './med-saved-note';

describe('medSavedMessage', () => {
  it('quotes the saved text', () => {
    expect(medSavedMessage('Bring back marble statues.')).toBe('"Bring back marble statues." has been saved for posterity.');
  });

  it('truncates long text', () => {
    const long = 'a'.repeat(100);
    const msg = medSavedMessage(long, 20);
    expect(msg).toBe(`"${'a'.repeat(19)}…" has been saved for posterity.`);
  });
});
