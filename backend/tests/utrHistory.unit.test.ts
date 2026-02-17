import { describe, expect, it } from 'bun:test';
import { recordUtrHistoryIfChanged } from '../src/services/utrHistory.js';

describe('recordUtrHistoryIfChanged', () => {
  it('creates history when no latest rating exists', async () => {
    const created: Array<{ userId: number; rating: number }> = [];
    const client = {
      utrHistory: {
        findFirst: async () => null,
        create: async ({ data }: { data: { userId: number; rating: number } }) => {
          created.push(data);
          return data;
        },
      },
    };

    const createdResult = await recordUtrHistoryIfChanged(client, 7, 8.5);
    expect(createdResult).toBe(true);
    expect(created).toEqual([{ userId: 7, rating: 8.5 }]);
  });

  it('skips history when rating matches latest', async () => {
    const created: Array<{ userId: number; rating: number }> = [];
    const client = {
      utrHistory: {
        findFirst: async () => ({ rating: 7.2 }),
        create: async ({ data }: { data: { userId: number; rating: number } }) => {
          created.push(data);
          return data;
        },
      },
    };

    const createdResult = await recordUtrHistoryIfChanged(client, 9, 7.2);
    expect(createdResult).toBe(false);
    expect(created).toEqual([]);
  });

  it('skips history when rating is null', async () => {
    const created: Array<{ userId: number; rating: number }> = [];
    const client = {
      utrHistory: {
        findFirst: async () => ({ rating: 7.2 }),
        create: async ({ data }: { data: { userId: number; rating: number } }) => {
          created.push(data);
          return data;
        },
      },
    };

    const createdResult = await recordUtrHistoryIfChanged(client, 9, null);
    expect(createdResult).toBe(false);
    expect(created).toEqual([]);
  });
});
