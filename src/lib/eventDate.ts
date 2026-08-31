/**
 * `EventData.date` is a display string ("Nov 22, 2025 @ 10AM—5PM"), not a
 * timestamp, so anything that needs a real date — the calendar view — has to
 * recover one from it.
 *
 * This is a stopgap. The durable fix is a machine-readable `startsAt` field on
 * EventData; parsing prose breaks the moment someone writes "next Thursday".
 */

/** Ordinal suffixes the site uses in copy: "March 11th, 2026". */
const ORDINAL = /(\d+)(st|nd|rd|th)\b/gi;

/** Splits the date half from the time half: "@ 6PM", "at 6pm". */
const TIME_SEPARATOR = /\s*@\s*|\s+at\s+/i;

/**
 * Parses the day out of a display string, ignoring the time (the calendar
 * places events by day). Returns null when the string can't be read, so
 * callers can surface those events instead of silently dropping them.
 */
export function parseEventDate(date: string): Date | null {
  const head = date.split(TIME_SEPARATOR)[0] ?? "";
  const cleaned = head.replace(ORDINAL, "$1").replace(/,\s*$/, "").trim();

  // Require an explicit year — `new Date("Feb 11")` silently yields 2001.
  if (!/\d{4}/.test(cleaned)) return null;

  const parsed = new Date(cleaned);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Same calendar day in the viewer's local timezone. */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export type EventStatus = "past" | "today" | "upcoming";

/**
 * Three-way status for calendar colouring. "today" wins over the other two,
 * so an event that already ended this evening still reads as current.
 */
export function getEventStatus(date: Date, now: Date = new Date()): EventStatus {
  if (isSameDay(date, now)) return "today";
  return date.getTime() > now.getTime() ? "upcoming" : "past";
}
