import { CalendarDays, Images, MapPin, Play } from "lucide-react";
import type { EventData } from "@/data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import SuitBadge, { CornerIndex } from "./SuitBadge";
import EventDialog from "./EventDialog";

/**
 * One event card, dealt as a playing card. DESIGN.md §7.2.
 *
 * Anatomy, top to bottom:
 *   suit badge ⟷ term   →   flag chips   →   date   →   room
 *   →  title  →  description  →  rule  →  media counts ⟷ corner index
 *
 * The date sits ABOVE the title on purpose: on an events page the date is the
 * primary scanning key, and the mono block gives every card the same anchor.
 *
 * The card itself is the trigger: clicking anywhere on it opens the popup that
 * holds the media, slides, handouts, and standings. Nothing heavy renders here.
 */
export type EventCardProps = EventData;

/** "WINTER 26" / "FALL 25" are terms, not flags — they read as an eyebrow. */
const TERM = /^(WINTER|FALL|SPRING|SUMMER)\s+\d{2}$/i;

export default function EventCard(props: EventCardProps) {
  const { title, date, location, type, description, tags, galleryImages } = props;

  const photoCount =
    galleryImages?.filter((item) => item.type === "image").length ?? 0;
  const videoCount =
    galleryImages?.filter((item) => item.type === "video").length ?? 0;

  const term = tags.find((tag) => TERM.test(tag));
  // A RECORDING tag duplicates the ▶ in the footer. The design gives "recording
  // available" a glyph rather than a chip, so drop the tag when the glyph shows.
  const flags = tags.filter(
    (tag) => !TERM.test(tag) && !(tag === "RECORDING" && videoCount > 0),
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group block w-full rounded-xl text-left focus-visible:outline-none"
        >
          <Card
            className={
              "relative h-full gap-4 py-5 shadow-[0_18px_40px_-16px_rgb(0_0_0/0.55),inset_0_1px_0_rgb(192_202_245/0.04)] " +
              "transition-[transform,border-color,background-color,box-shadow] duration-150 ease-out " +
              "group-hover:-translate-y-[3px] group-hover:border-border-hover group-hover:bg-accent " +
              "group-hover:shadow-[0_26px_52px_-18px_rgb(0_0_0/0.62),inset_0_1px_0_rgb(192_202_245/0.06)] " +
              "group-focus-visible:-translate-y-[3px] group-focus-visible:border-border-hover " +
              "group-focus-visible:bg-accent group-focus-visible:ring-2 group-focus-visible:ring-ring " +
              "group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background " +
              "motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
            }
          >
            <CardHeader className="flex flex-col gap-3 px-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <SuitBadge type={type} />
                {term && (
                  <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-muted-foreground">
                    {term}
                  </span>
                )}
              </div>

              {flags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {flags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="rounded-md border-input px-2 py-0.5 font-mono text-[10.5px] font-semibold tracking-[0.06em] text-muted-foreground"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="space-y-1">
                <p className="flex items-center gap-1.5 font-mono text-[13px] font-medium tabular-nums text-foreground uppercase">
                  <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
                  {date}
                </p>
                <p className="flex items-center gap-1.5 font-mono text-[12.5px] font-medium tracking-[0.02em] text-muted-foreground uppercase">
                  <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                  {location}
                </p>
              </div>

              <CardTitle className="text-[17px] leading-snug font-semibold tracking-[-0.01em]">
                {title}
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 px-5">
              <p className="text-sm leading-relaxed text-body-foreground">
                {description}
              </p>
            </CardContent>

            <div className="mt-auto flex items-center justify-between gap-4 border-t px-5 pt-4">
              <span className="flex flex-wrap items-center gap-4 font-mono text-[11.5px] text-muted-foreground">
                {photoCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Images className="size-3.5" aria-hidden="true" />
                    {photoCount} {photoCount === 1 ? "photo" : "photos"}
                  </span>
                )}
                {videoCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Play className="size-3.5" aria-hidden="true" />
                    {videoCount === 1 ? "Recording" : `${videoCount} recordings`}
                  </span>
                )}
              </span>
              <CornerIndex type={type} />
            </div>
          </Card>
        </button>
      </DialogTrigger>

      <EventDialog {...props} />
    </Dialog>
  );
}
