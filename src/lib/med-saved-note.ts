export function medSavedMessage(text: string, maxLen = 80): string {
  const t = text.trim();
  if (!t) return 'Saved for posterity.';
  const shown = t.length > maxLen ? `${t.slice(0, maxLen - 1)}…` : t;
  return `"${shown}" has been saved for posterity.`;
}
