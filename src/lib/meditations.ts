import type { DailyMeditationsDto, Meditation } from '../../shared/api-types';
import { api } from './api';

let medsCache: DailyMeditationsDto | null = null;

export async function ensureDailyMeditations(): Promise<DailyMeditationsDto> {
  medsCache = await api.getMeditations();
  return medsCache;
}

export function getCachedDailyMeditations(): DailyMeditationsDto | null {
  return medsCache;
}

export async function deleteMeditation(id: string): Promise<DailyMeditationsDto> {
  await api.deleteMeditation(id);
  medsCache = await api.getMeditations();
  return medsCache;
}

export async function addMeditation(data: { text: string; url?: string }): Promise<Meditation> {
  return api.addMeditation(data);
}
