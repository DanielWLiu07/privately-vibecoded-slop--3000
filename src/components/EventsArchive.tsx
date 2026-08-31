import { useState } from "react";
import type { EventType } from "@/data";
import { useEvents } from "@/hooks/useEvents";
import ArchiveFilters from "./ArchiveFilters";
import EventCards from "./EventCards";
import Section from "./Section";

export default function EventsArchive() {
  const [type, setType] = useState<EventType | "All">("All");
  const [search, setSearch] = useState("");

  const { events, total, loading, error } = useEvents({
    ...(type === "All" ? {} : { type }),
    ...(search.trim() ? { search: search.trim() } : {}),
  });

  return (
    <Section
      id="events-archive"
      className="felt-pool"
      title="Events Archive"
      aside={
        !loading && !error ? (
          <span className="font-mono text-[12.5px] tabular-nums text-muted-foreground">
            {total} {total === 1 ? "event" : "events"}
          </span>
        ) : null
      }
    >
      <ArchiveFilters
        type={type}
        search={search}
        onTypeChange={setType}
        onSearchChange={setSearch}
      />
      <EventCards
        events={events}
        loading={loading}
        error={error}
        emptyMessage="No past events match those filters."
        skeletonCount={4}
      />
    </Section>
  );
}
