import { CalendarDays, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export type EventsViewMode = "cards" | "calendar";

export interface ViewToggleProps {
  view: EventsViewMode;
  onViewChange: (view: EventsViewMode) => void;
}

const OPTIONS = [
  { value: "cards", label: "Cards", Icon: LayoutGrid },
  { value: "calendar", label: "Calendar", Icon: CalendarDays },
] as const;

/** Segmented control switching the events area between cards and a calendar. */
export default function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Events view"
      className="inline-flex items-center gap-1 rounded-lg border bg-muted/40 p-1"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = view === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => onViewChange(value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
