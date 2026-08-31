import { type EventData, eventSlug } from "@/data";
import EventCard from "./EventCard";

export interface EventCardsProps {
  events: EventData[];
  loading?: boolean;
  error?: Error | null;
  /** Shown when the request succeeds but matches nothing. */
  emptyMessage?: string;
  /** Placeholder cards rendered while loading. */
  skeletonCount?: number;
}

const GRID = "mt-6 grid gap-4 sm:grid-cols-2";

/** Face-down cards: the same anatomy as EventCard, blocked out. DESIGN.md §7.2. */
function CardSkeleton() {
  const bar = "animate-pulse rounded bg-secondary";
  return (
    <div className="h-full rounded-xl border bg-card py-5 shadow-[0_18px_40px_-16px_rgb(0_0_0/0.55)]">
      <div className="flex flex-col gap-3 px-5">
        <div className="flex items-center justify-between">
          <div className={`${bar} h-5 w-[40%]`} />
          <div className={`${bar} h-3 w-[18%]`} />
        </div>
        <div className={`${bar} h-3.5 w-[70%]`} />
        <div className={`${bar} h-3.5 w-[45%]`} />
        <div className={`${bar} h-4 w-[85%]`} />
      </div>
      <div className="mt-4 flex flex-col gap-2 px-5">
        <div className={`${bar} h-3 w-full`} />
        <div className={`${bar} h-3 w-[92%]`} />
        <div className={`${bar} h-3 w-[55%]`} />
      </div>
      <div className="mt-5 border-t px-5 pt-4">
        <div className={`${bar} h-3 w-[30%]`} />
      </div>
    </div>
  );
}

/** Grid of event cards, plus the loading / error / empty states around it. */
export default function EventCards({
  events,
  loading = false,
  error = null,
  emptyMessage = "No events to show yet — check back soon.",
  skeletonCount = 4,
}: EventCardsProps) {
  if (loading) {
    return (
      <div className={GRID} aria-busy="true">
        {Array.from({ length: skeletonCount }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p
        role="alert"
        className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-8 text-center text-sm text-destructive"
      >
        Couldn&apos;t load events: {error.message}
      </p>
    );
  }

  if (events.length === 0) {
    return (
      <p className="mt-6 rounded-xl border border-dashed border-input px-4 py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className={GRID}>
      {events.map((event) => (
        <EventCard key={eventSlug(event)} {...event} />
      ))}
    </div>
  );
}
