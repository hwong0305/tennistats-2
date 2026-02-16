import { describe, expect, it } from 'vitest';
import { formatHumanDate, toDateInputValue } from './date';

describe('toDateInputValue', () => {
  it('returns YYYY-MM-DD unchanged', () => {
    expect(toDateInputValue('2026-02-15')).toBe('2026-02-15');
  });

  it('normalizes ISO timestamps', () => {
    expect(toDateInputValue('2026-02-15T10:20:30.000Z')).toBe('2026-02-15');
  });

  it('returns empty string for invalid dates', () => {
    expect(toDateInputValue('not-a-date')).toBe('');
  });

  it('formats date-only strings without timezone shift', () => {
    expect(formatHumanDate('2026-02-15')).toBe('Feb 15, 2026');
  });

  it('formats UTC timestamps without timezone shift', () => {
    expect(formatHumanDate('2026-02-15T00:00:00.000Z')).toBe('Feb 15, 2026');
  });
});
