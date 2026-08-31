import { useState } from "react";
import EventsArchive from "./EventsArchive";
import EventsCalendar from "./EventsCalendar";
import UpcomingEvents from "./UpcomingEvents";
import ViewToggle, { type EventsViewMode } from "./ViewToggle";

/**
 * Owns the cards/calendar switch for the whole events area. Each branch
 * mounts its own container components, so the calendar only fetches when
 * it is actually on screen.
 */
export default function EventsView() {
  const [view, setView] = useState<EventsViewMode>("cards");

  return (
    <div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {view === "cards"
            ? "Switch to the calendar to see past and upcoming events side by side."
            : "Every event on one grid — past, today, and upcoming."}
        </p>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {view === "cards" ? (
        <>
          <UpcomingEvents />
          <EventsArchive />
        </>
      ) : (
        <EventsCalendar />
      )}
    </div>
  );
}
