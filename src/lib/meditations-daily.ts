/** True when GET should draw (or redraw) today's meditation assignment. */
export function needsDailyMeditationDraw(assigned: string[] | null, meditationCount: number): boolean {
  if (assigned === null) return true;
  if (assigned.length > 0) return false;
  return meditationCount > 0;
}

/** Only persist a day row once we have items to show (avoids locking in empty days). */
export function shouldPersistDailyAssignment(assignedIds: string[]): boolean {
  return assignedIds.length > 0;
}
