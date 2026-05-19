import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DAILY_COUNT } from '../../exercises';
import type { DayStateDto } from '../../shared/api-types';
import { api } from './api';
import { ensureDayState, markDailyComplete } from './storage';

vi.mock('./api', () => ({
  api: {
    getDay: vi.fn(),
    completeDay: vi.fn(),
    getDrafts: vi.fn(),
    putDraft: vi.fn(),
    migrate: vi.fn(),
  },
}));

const getDay = vi.mocked(api.getDay);
const completeDay = vi.mocked(api.completeDay);

function day(overrides: Partial<DayStateDto> = {}): DayStateDto {
  return {
    dateKey: '2026-05-19',
    assignedIds: ['a', 'b'],
    completedIds: [],
    dailyComplete: false,
    nextId: 'a',
    ...overrides,
  };
}

beforeEach(() => {
  getDay.mockReset();
  completeDay.mockReset();
});

describe('ensureDayState', () => {
  it('loads day state from api', async () => {
    getDay.mockResolvedValue(day());
    const s = await ensureDayState();
    expect(s.assignedIds.length).toBe(2);
    expect(s.completedIds).toEqual([]);
  });
});

describe('markDailyComplete', () => {
  it('posts completion to api', async () => {
    getDay.mockResolvedValue(day());
    await ensureDayState();
    completeDay.mockResolvedValue(day({ completedIds: ['a'], nextId: 'b' }));
    const after = await markDailyComplete('a');
    expect(after.completedIds).toEqual(['a']);
    expect(completeDay).toHaveBeenCalledWith('a');
  });

  it('reflects full completion', async () => {
    getDay.mockResolvedValue(day({ assignedIds: ['x', 'y'].slice(0, DAILY_COUNT) }));
    await ensureDayState();
    completeDay.mockResolvedValue(day({
      assignedIds: ['x', 'y'],
      completedIds: ['x', 'y'],
      dailyComplete: true,
      nextId: null,
    }));
    const after = await markDailyComplete('y');
    expect(after.dailyComplete).toBe(true);
  });
});
