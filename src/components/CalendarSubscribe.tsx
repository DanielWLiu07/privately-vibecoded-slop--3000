import { CalendarPlus } from "lucide-react";
import { SITE } from "@/siteConfig";
import { Button } from "@/components/ui/button";

export interface CalendarSubscribeProps {
  /** Defaults to the term in siteConfig, e.g. "Winter 2026". */
  term?: string;
  href?: string;
}

export default function CalendarSubscribe({
  term = SITE.calendarTerm,
  href = SITE.calendarUrl,
}: CalendarSubscribeProps) {
  return (
    <Button asChild variant="outline" className="mt-5">
      <a href={href}>
        <CalendarPlus aria-hidden="true" />
        Subscribe to {SITE.shortName}&apos;s {term} Events Calendar
      </a>
    </Button>
  );
}
