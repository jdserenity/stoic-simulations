/** True when GET should draw today's meditation assignment. */
export function needsDailyMeditationDraw(assigned: string[] | null): boolean {
  return assigned === null;
}

/** Only persist a day row once we have items to show (avoids locking in empty days). */
export function shouldPersistDailyAssignment(assignedIds: string[]): boolean {
  return assignedIds.length > 0;
}
