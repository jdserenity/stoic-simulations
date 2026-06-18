const X_STATUS_RE = /^https?:\/\/(?:(?:www|mobile)\.)?(?:x|twitter)\.com\/\w+\/status\/\d+/i;

export function isXStatusUrl(s: string): boolean {
  return X_STATUS_RE.test(s.trim());
}

/** x.com → twitter.com, strip tracking query. */
export function canonicalXStatusUrl(s: string): string {
  return s.trim()
    .replace(/^(https?:\/\/)(?:www\.|mobile\.)?x\.com/i, '$1twitter.com')
    .replace(/\?.*$/, '');
}

export function tweetTextFromOembedHtml(html: string): string | null {
  const m = html.match(/<blockquote[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!m) return null;
  const plain = m[1]
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return plain || null;
}

export async function resolveMeditationCapture(
  text: string,
  url: string | undefined,
  fetchFn: typeof fetch = fetch,
): Promise<{ text: string; url?: string }> {
  const rawText = text.trim();
  const rawUrl = url?.trim();
  const statusUrl = isXStatusUrl(rawText) ? rawText : (rawUrl && isXStatusUrl(rawUrl) ? rawUrl : null);
  if (!statusUrl) return { text: rawText, url: rawUrl };
  const canonical = canonicalXStatusUrl(statusUrl);
  try {
    const res = await fetchFn(`https://publish.twitter.com/oembed?omit_script=1&url=${encodeURIComponent(canonical)}`);
    if (!res.ok) return { text: rawText, url: canonical };
    const data = await res.json() as { html?: string };
    const tweetText = data.html ? tweetTextFromOembedHtml(data.html) : null;
    if (!tweetText) return { text: rawText, url: canonical };
    return { text: tweetText, url: canonical };
  } catch {
    return { text: rawText, url: canonical };
  }
}
