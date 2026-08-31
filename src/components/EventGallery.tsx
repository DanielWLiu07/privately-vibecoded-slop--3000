import type { GalleryItem } from "@/data";

export interface EventGalleryProps {
  items: GalleryItem[];
  /** Fallback title used when a video has no alt text. */
  eventTitle: string;
}

/**
 * Photos and video embeds for one event. Everything is a remote URL — images
 * load lazily, videos are iframe embeds (YouTube `/embed/…` and friends).
 */
export default function EventGallery({ items, eventTitle }: EventGalleryProps) {
  const videos = items.filter((item) => item.type === "video");
  const images = items.filter((item) => item.type === "image");

  return (
    <div className="space-y-4">
      {videos.map((video) => (
        <div
          key={video.src}
          className="aspect-video w-full overflow-hidden rounded-lg border bg-muted"
        >
          <iframe
            src={video.src}
            title={video.alt || `${eventTitle} recording`}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="size-full border-0"
          />
        </div>
      ))}

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {images.map((image) => (
            <figure key={image.src} className="space-y-1">
              <img
                src={image.src}
                alt={image.alt}
                loading="lazy"
                className="aspect-[4/3] w-full rounded-lg border bg-muted object-cover"
              />
              {image.alt && (
                <figcaption className="text-xs text-muted-foreground">
                  {image.alt}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
