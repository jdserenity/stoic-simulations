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

export type Meditation = {
  id: string;
  text: string;
  url?: string;
};

export type DailyMeditationsDto = {
  dateKey: string;
  items: Meditation[];
};
