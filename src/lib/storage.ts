import type { DayStateDto } from '../../shared/api-types';
import { api } from './api';

export type DayState = DayStateDto;

let dayCache: DayState | null = null;
const draftFields: Record<string, Record<string, string>> = {};
const draftTimers: Record<string, number> = {};

function draftKey(exerciseId: string, scope: 'daily' | 'library'): string {
  return `${scope}:${exerciseId}`;
}

export async function ensureDayState(): Promise<DayState> {
  dayCache = await api.getDay();
  return dayCache;
}

export function getCachedDayState(): DayState | null {
  return dayCache;
}

export async function markDailyComplete(exerciseId: string): Promise<DayState> {
  dayCache = await api.completeDay(exerciseId);
  return dayCache;
}

export async function loadDraftFields(
  exerciseId: string,
  scope: 'daily' | 'library',
): Promise<Record<string, string>> {
  const key = draftKey(exerciseId, scope);
  if (draftFields[key]) return draftFields[key];
  const { fields } = await api.getDrafts(exerciseId, scope);
  draftFields[key] = fields;
  return fields;
}

export function getDraftField(
  exerciseId: string,
  fieldId: string,
  scope: 'daily' | 'library',
): string {
  return draftFields[draftKey(exerciseId, scope)]?.[fieldId] ?? '';
}

export function saveDraft(
  exerciseId: string,
  fieldId: string,
  scope: 'daily' | 'library',
  value: string,
): void {
  const key = draftKey(exerciseId, scope);
  if (!draftFields[key]) draftFields[key] = {};
  if (value) draftFields[key][fieldId] = value;
  else delete draftFields[key][fieldId];

  const timerKey = `${key}:${fieldId}`;
  clearTimeout(draftTimers[timerKey]);
  draftTimers[timerKey] = window.setTimeout(() => {
    api.putDraft({ exerciseId, fieldId, scope, value }).catch(() => {});
  }, 400);
}
