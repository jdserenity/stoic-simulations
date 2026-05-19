import type { DayStateDto, DraftDto } from '../../shared/api-types';
import { getClientId } from './client-id';

const BASE = import.meta.env.VITE_API_BASE ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Id': getClientId(),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getDay: () => request<DayStateDto>('/api/day'),
  completeDay: (exerciseId: string) => request<DayStateDto>('/api/day', {
    method: 'POST',
    body: JSON.stringify({ exerciseId }),
  }),
  getDrafts: (exerciseId: string, scope: 'daily' | 'library') => {
    const q = new URLSearchParams({ exerciseId, scope });
    return request<{ fields: Record<string, string> }>(`/api/drafts?${q}`);
  },
  putDraft: (draft: DraftDto) => request<{ ok: boolean }>('/api/drafts', {
    method: 'PUT',
    body: JSON.stringify(draft),
  }),
  migrate: (body: unknown) => request<{ ok: boolean }>('/api/migrate', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
};
