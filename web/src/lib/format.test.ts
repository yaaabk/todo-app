import { describe, expect, it } from 'vitest';
import { formatDueDate, isOverdue } from './format';

/** A fixed "today" of 12 March 2026. */
const now = new Date(2026, 2, 12);

describe('formatDueDate', () => {
  it('labels a past unfinished task as overdue', () => {
    expect(formatDueDate('2026-03-11', false, now)).toBe('Overdue');
  });

  it('labels the current day and the next day', () => {
    expect(formatDueDate('2026-03-12', false, now)).toBe('Due today');
    expect(formatDueDate('2026-03-13', false, now)).toBe('Due tomorrow');
  });

  it('uses a short date for later dates', () => {
    expect(formatDueDate('2026-03-20', false, now)).toBe('20 Mar');
  });

  it('shows the date instead of Overdue for a completed task', () => {
    expect(formatDueDate('2026-03-11', true, now)).toBe('11 Mar');
  });

  it('returns an unrecognised date unchanged', () => {
    expect(formatDueDate('not-a-date', false, now)).toBe('not-a-date');
  });
});

describe('isOverdue', () => {
  it('is true only for an unfinished task in the past', () => {
    expect(isOverdue('2026-03-11', false, now)).toBe(true);
    expect(isOverdue('2026-03-11', true, now)).toBe(false);
    expect(isOverdue('2026-03-12', false, now)).toBe(false);
    expect(isOverdue(null, false, now)).toBe(false);
  });
});
