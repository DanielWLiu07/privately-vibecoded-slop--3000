import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/siteConfig";

/** Pre-filled email to the club — swap for a form URL if one ever exists. */
const DEFAULT_HREF = `mailto:${SITE.email}?subject=${encodeURIComponent(
  "Event suggestion"
)}`;

export interface SuggestEventProps {
  title?: string;
  description?: string;
  href?: string;
  ctaLabel?: string;
}

/** Small prompt asking members to pitch an event idea. */
export default function SuggestEvent({
  title = "Have an idea for an event?",
  description = "Tell us what you'd like to see — a workshop, a firm, a game night.",
  href = DEFAULT_HREF,
  ctaLabel = "Suggest an event",
}: SuggestEventProps) {
  return (
    <section className="mt-12 rounded-xl border border-dashed px-6 py-8 text-center">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <Button asChild className="mt-4">
        <a href={href}>
          <Lightbulb aria-hidden="true" />
          {ctaLabel}
        </a>
      </Button>
    </section>
  );
}
