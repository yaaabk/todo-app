/** Milliseconds in one day, used for whole-day differences. */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Short month names for the compact date label. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A `YYYY-MM-DD` date split into its parts, with a UTC timestamp for comparisons. */
interface ParsedDate {
  year: number;
  month: number;
  day: number;
  time: number;
}

/** Parses a `YYYY-MM-DD` date, or returns `null` when it is not a real date. */
function parseDueDate(dueDate: string): ParsedDate | null {
  const match = DATE_PATTERN.exec(dueDate);
  if (match === null) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const time = Date.UTC(year, month - 1, day);
  const parsed = new Date(time);

  // `Date.UTC` rolls invalid dates forward (for example, 2026-02-31), so
  // compare the parts back before trusting the value.
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day, time };
}

/** Formats a parsed date as a short label such as `12 Mar`. */
function shortDate({ day, month }: ParsedDate): string {
  return `${day} ${MONTHS[month - 1]}`;
}

/** The number of whole days from `now` to `dueDate`, or `NaN` for a bad date. */
function daysUntil(dueDate: string, now: Date): number {
  const parsed = parseDueDate(dueDate);
  if (parsed === null) return Number.NaN;

  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parsed.time - today) / MS_PER_DAY);
}

/**
 * Labels a due date for the task list.
 *
 * Unfinished tasks in the past read `Overdue`; the current day and the next
 * day get their own labels; later dates fall back to a short date. A completed
 * task always shows its date instead of a warning.
 */
export function formatDueDate(dueDate: string, completed = false, now: Date = new Date()): string {
  const parsed = parseDueDate(dueDate);
  if (parsed === null) return dueDate;

  const days = daysUntil(dueDate, now);
  if (days < 0) return completed ? shortDate(parsed) : 'Overdue';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return shortDate(parsed);
}

/** True when an unfinished task's due date is before today. */
export function isOverdue(
  dueDate: string | null,
  completed = false,
  now: Date = new Date(),
): boolean {
  if (dueDate === null || completed) return false;
  return daysUntil(dueDate, now) < 0;
}
