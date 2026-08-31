import type { EventType } from "@/data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Category badge, encoded as a playing-card suit. DESIGN.md §5.
 *
 * Four categories, four suits, mapped by SUIT RANK (♠ > ♥ > ♦ > ♣) so the
 * glyph tracks how much the club stakes on each kind of event. The warm/cool
 * split matches a real deck (♥♦ warm, ♠♣ cool) without pretending a dark
 * theme can print two suits in black.
 *
 * The glyph is the redundant signal: category never depends on hue alone.
 * Colour comes from `--suit`, set by the `data-suit` attribute in index.css,
 * so the measured 10% tint lives in one place.
 */
export const SUIT: Record<EventType, string> = {
  Competition: "♠",
  Panel: "♥",
  "Sponsor Event": "♦",
  Workshop: "♣",
};

/** Corner-index letter, the way a real card abbreviates its rank. */
export const SUIT_INITIAL: Record<EventType, string> = {
  Competition: "C",
  Panel: "P",
  "Sponsor Event": "S",
  Workshop: "W",
};

export interface SuitBadgeProps {
  type: EventType;
  className?: string;
}

export default function SuitBadge({ type, className }: SuitBadgeProps) {
  return (
    <Badge
      data-suit={type}
      variant="outline"
      className={cn(
        "gap-1.5 rounded-md border-[var(--suit-edge)] bg-[var(--suit-tint)] px-2 py-0.5",
        "font-semibold text-[var(--suit)]",
        className,
      )}
    >
      <span aria-hidden="true">{SUIT[type]}</span>
      {type}
    </Badge>
  );
}

/**
 * The bottom-right index. Decorative — the badge above already carries the
 * readable label, so this is aria-hidden. It sits in flow in the card's footer
 * row rather than absolutely, so it can never land on a description's last line.
 *
 * NOT rotated 180°, which DESIGN.md §7.2 called for. A real card inverts its
 * bottom index because the card can be held either way; a screen has no such
 * rationale, and inverted it just reads as mojibake ("♣ W" renders as "M ♣").
 */
export function CornerIndex({ type }: { type: EventType }) {
  return (
    <span
      data-suit={type}
      aria-hidden="true"
      className="shrink-0 font-mono text-xs font-bold tracking-[0.14em] text-[var(--suit)] opacity-70"
    >
      {SUIT_INITIAL[type]} {SUIT[type]}
    </span>
  );
}
