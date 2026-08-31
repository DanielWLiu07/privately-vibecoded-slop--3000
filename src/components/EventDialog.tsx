import { CalendarDays, FileText, MapPin, Presentation } from "lucide-react";
import type { EventData } from "@/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EventGallery from "./EventGallery";
import EventRankings from "./EventRankings";

export type EventDialogProps = EventData;

/**
 * The popup behind every event card: media, slides, handouts, and standings.
 * Radix unmounts this while closed, so no image or iframe loads until the
 * card is actually clicked.
 */
export default function EventDialog({
  title,
  date,
  location,
  type,
  description,
  tags,
  posterImage,
  galleryImages,
  slideDeckUrl,
  pdfUrl,
  rankings,
}: EventDialogProps) {
  const hasLinks = Boolean(slideDeckUrl || pdfUrl);

  return (
    <DialogContent className="max-h-[85vh] gap-0 overflow-y-auto p-0 sm:max-w-3xl">
      <DialogHeader className="space-y-0 border-b p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{type}</Badge>
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="tracking-wide">
              {tag}
            </Badge>
          ))}
        </div>

        <DialogTitle className="pr-8 text-xl leading-snug">{title}</DialogTitle>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            {location}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
            {date}
          </span>
        </div>

        <DialogDescription className="mt-3 text-left text-sm">
          {description}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 p-6">
        {hasLinks && (
          <div className="flex flex-wrap gap-2">
            {slideDeckUrl && (
              <Button asChild size="sm" variant="outline">
                <a href={slideDeckUrl} target="_blank" rel="noreferrer">
                  <Presentation aria-hidden="true" />
                  Slide deck
                </a>
              </Button>
            )}
            {pdfUrl && (
              <Button asChild size="sm" variant="outline">
                <a href={pdfUrl} target="_blank" rel="noreferrer">
                  <FileText aria-hidden="true" />
                  Handout (PDF)
                </a>
              </Button>
            )}
          </div>
        )}

        {rankings && rankings.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Final standings</h3>
            <EventRankings rankings={rankings} />
          </section>
        )}

        {galleryImages && galleryImages.length > 0 ? (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Gallery</h3>
            <EventGallery items={galleryImages} eventTitle={title} />
          </section>
        ) : posterImage ? (
          <img
            src={posterImage}
            alt={`${title} poster`}
            loading="lazy"
            className="mx-auto max-h-[60vh] rounded-lg border bg-muted"
          />
        ) : null}
      </div>
    </DialogContent>
  );
}
