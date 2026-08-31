import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type EventData, eventSlug } from "@/data";
import { useEvents } from "@/hooks/useEvents";
import {
  getEventStatus,
  isSameDay,
  parseEventDate,
  type EventStatus,
} from "@/lib/eventDate";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Section from "./Section";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Colour per status — the whole point of the calendar view. */
const CHIP: Record<EventStatus, string> = {
  past: "bg-muted text-muted-foreground",
  today: "bg-primary text-primary-foreground font-medium",
  upcoming: "border border-primary/40 bg-primary/10 text-primary",
};

const LEGEND: { status: EventStatus; label: string }[] = [
  { status: "past", label: "Past" },
  { status: "today", label: "Today" },
  { status: "upcoming", label: "Upcoming" },
];

interface DatedEvent {
  event: EventData;
  date: Date;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** The visible grid: whole weeks (Sun–Sat) covering the given month. */
function buildDays(month: Date): Date[] {
  const first = startOfMonth(month);
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0
  ).getDate();
  const cells = Math.ceil((first.getDay() + daysInMonth) / 7) * 7;

  return Array.from({ length: cells }, (_, i) => {
    const d = new Date(first);
    d.setDate(1 - first.getDay() + i);
    return d;
  });
}

export default function EventsCalendar() {
  const { events, loading, error } = useEvents();
  const [month, setMonth] = useState<Date | null>(null);
  const today = new Date();

  const { dated, undated } = useMemo(() => {
    const dated: DatedEvent[] = [];
    const undated: EventData[] = [];

    for (const event of events) {
      const date = parseEventDate(event.date);
      if (date) dated.push({ event, date });
      else undated.push(event);
    }

    dated.sort((a, b) => a.date.getTime() - b.date.getTime());
    return { dated, undated };
  }, [events]);

  /**
   * Opening on the current month would show a blank grid whenever the archive
   * is between terms. Prefer the next upcoming event, else the most recent.
   */
  const fallbackMonth = useMemo(() => {
    if (dated.length === 0) return startOfMonth(new Date());
    const next = dated.find((d) => d.date.getTime() > Date.now());
    const target = next ?? dated[dated.length - 1];
    return startOfMonth(target.date);
  }, [dated]);

  const active = month ?? fallbackMonth;
  const days = useMemo(() => buildDays(active), [active]);

  const byDay = useMemo(() => {
    const map = new Map<string, DatedEvent[]>();
    for (const item of dated) {
      const key = dayKey(item.date);
      const bucket = map.get(key);
      if (bucket) bucket.push(item);
      else map.set(key, [item]);
    }
    return map;
  }, [dated]);

  const monthCount = dated.filter(
    ({ date }) =>
      date.getFullYear() === active.getFullYear() &&
      date.getMonth() === active.getMonth()
  ).length;

  const label = active.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <Section
      id="events-calendar"
      title="Calendar"
      aside={
        !loading && !error ? (
          <span className="text-sm text-muted-foreground">
            {monthCount} {monthCount === 1 ? "event" : "events"} this month
          </span>
        ) : null
      }
    >
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="outline"
            aria-label="Previous month"
            onClick={() => setMonth(addMonths(active, -1))}
          >
            <ChevronLeft />
          </Button>
          <span className="min-w-40 text-center text-sm font-medium">
            {label}
          </span>
          <Button
            size="icon-sm"
            variant="outline"
            aria-label="Next month"
            onClick={() => setMonth(addMonths(active, 1))}
          >
            <ChevronRight />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setMonth(startOfMonth(today))}
          >
            Today
          </Button>
        </div>

        <ul className="flex items-center gap-3 text-xs text-muted-foreground">
          {LEGEND.map(({ status, label: text }) => (
            <li key={status} className="flex items-center gap-1.5">
              <span className={cn("size-3 rounded-sm", CHIP[status])} />
              {text}
            </li>
          ))}
        </ul>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-destructive/40 px-4 py-8 text-center text-sm text-destructive"
        >
          Couldn&apos;t load events: {error.message}
        </p>
      ) : loading ? (
        <div className="mt-4 h-[28rem] animate-pulse rounded-xl border bg-muted/50" />
      ) : (
        <>
          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[42rem] overflow-hidden rounded-xl border-r border-b">
              <div className="grid grid-cols-7">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="border-t border-l bg-muted/40 py-2 text-center text-xs font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}

                {days.map((day) => {
                  const inMonth = day.getMonth() === active.getMonth();
                  const isToday = isSameDay(day, today);

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "min-h-24 border-t border-l p-1.5",
                        !inMonth && "bg-muted/20",
                        isToday && "bg-primary/5"
                      )}
                    >
                      <div
                        className={cn(
                          "mb-1 flex size-5 items-center justify-center text-xs",
                          !inMonth && "text-muted-foreground/60",
                          isToday &&
                            "rounded-full bg-primary font-semibold text-primary-foreground"
                        )}
                      >
                        {day.getDate()}
                      </div>

                      <div className="space-y-1">
                        {(byDay.get(dayKey(day)) ?? []).map(({ event, date }) => (
                          <span
                            key={eventSlug(event)}
                            title={`${event.title} — ${event.date}`}
                            className={cn(
                              "block truncate rounded px-1.5 py-0.5 text-[11px] leading-tight",
                              CHIP[getEventStatus(date, today)]
                            )}
                          >
                            {event.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {undated.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Not shown on the grid (unreadable date):{" "}
              {undated.map((e) => e.title).join(", ")}
            </p>
          )}
        </>
      )}
    </Section>
  );
}
