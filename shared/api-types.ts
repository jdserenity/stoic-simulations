export type DayStateDto = {
  dateKey: string;
  assignedIds: string[];
  completedIds: string[];
  dailyComplete: boolean;
  nextId: string | null;
};

export type DraftDto = {
  exerciseId: string;
  fieldId: string;
  scope: 'daily' | 'library';
  value: string;
};
