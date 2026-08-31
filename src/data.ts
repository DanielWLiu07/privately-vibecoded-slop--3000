/**
 * Fake WQC events "backend".
 *
 * Everything below is dummy data — no network, no server, and no local assets:
 * every image, video, slide deck, and poster is a remote URL, so the app runs
 * without anything checked into the repo. The `fetch*` helpers are async and
 * shaped like a real REST API so components can be written against them today
 * and swapped for a real endpoint later:
 *
 *   const { data } = await fetchEvents({ type: "Workshop", limit: 5 });
 *   const event   = await fetchEvent("options-101");
 */

export type EventType = "Competition" | "Workshop" | "Sponsor Event" | "Panel";

export const EVENT_TYPES: readonly EventType[] = [
  "Competition",
  "Workshop",
  "Sponsor Event",
  "Panel",
];

/** One item in an event's media gallery. Always a remote URL. */
export interface GalleryItem {
  /** "image" → <img>; "video" → embeddable iframe URL (e.g. youtube.com/embed/…). */
  type: "image" | "video";
  src: string;
  /** Empty string is fine — it marks the image as decorative. */
  alt: string;
}

/** A row in a competition leaderboard. */
export interface Ranking {
  rank: number;
  name: string;
  score: number;
}

export interface EventData {
  title: string;
  /** Pre-formatted date exactly as it reads on the site. */
  date: string;
  /** Room / venue string. */
  location: string;
  type: EventType;
  description: string;
  /** Short uppercase labels, e.g. "WINTER 26", "RECORDING". */
  tags: string[];
  /** Portrait promo poster, shown when there's no gallery yet. */
  posterImage?: string;
  /** Photos and video embeds from the event. */
  galleryImages?: GalleryItem[];
  /** Published Google Slides URL. */
  slideDeckUrl?: string;
  /** Handout / problem set PDF. */
  pdfUrl?: string;
  /** Final standings, for competitions. */
  rankings?: Ranking[];
}

/** Newest first, the way the Events Archive renders them. */
const Events: EventData[] = [
  {
    title: "Statistical and Human Biases",
    date: "January 28, 2026 @ 6:00PM",
    location: "DC 1350",
    type: "Workshop",
    posterImage: "https://placehold.co/800x1200?text=Statistical+and+Human+Biases",
    tags: ["WINTER 26"],
    description: "Learn about the statistical pitfalls and cognitive traps that lead smart people to make not-so-smart trades.",
  },
  {
    title: "Quant Panel Q&A",
    date: "January 21, 2026 @ 6-8pm",
    location: "DC 1350",
    type: "Panel",
    description: "Ever wondered what quants actually do? Join us for a panel with Waterloo students who have worked at companies such as Jane Street, SIG, HRT, and Point72.",
    tags: ["WINTER 26"],
    galleryImages: [
      { type: "image", src: "https://placehold.co/800x600?text=Quant+Panel+1", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Quant+Panel+2", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Quant+Panel+3", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Quant+Panel+4", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Quant+Panel+5", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Quant+Panel+6", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Quant+Panel+7", alt: "" },
    ],
  },
  {
    title: "Citadel Securities Trading Challenge",
    date: "Jan 14, 2026 @ 6-8pm",
    location: "DC 1350",
    type: "Sponsor Event",
    description:
      "Learn about trading, put your market-making skills to the test, and connect with full-time Citadel traders. Sign up through our Instagram.",
    tags: ["WINTER 26", "COMPETITION"],
    galleryImages: [
      { type: "image", src: "https://placehold.co/800x600?text=Citadel+1", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Citadel+2", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Citadel+3", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Citadel+4", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Citadel+5", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Citadel+6", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Citadel+7", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Citadel+8", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Citadel+9", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Citadel+10", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Citadel+11", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Citadel+12", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Citadel+13", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Citadel+14", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Citadel+15", alt: "" },
    ],
  },
  {
    title: "Capital Markets",
    date: "Nov 26, 2025 @ 6:00PM",
    location: "RCH 302",
    type: "Workshop",
    description:
      "An overview of Capital Markets theory (CapM) — understanding and exploring the relationship between risk and expected return.",
    tags: ["FALL 25", "RECORDING"],
    galleryImages: [
      {
        type: "video",
        src: "https://www.youtube.com/embed/PpJN-D7hvbg",
        alt: "Capital Markets Workshop Recording",
      },
    ],
    slideDeckUrl:
      "https://docs.google.com/presentation/d/e/2PACX-1vSSsqndHYJE7lZ57iMBTlmHZUYduD6Umil6eSrN0zCPGcfGWGqFQUtfU8S1jtdPLw/pub?start=true&loop=true&delayms=3000",
  },
  {
    title: "Fall 2025 Trading Competition",
    date: "Nov 22, 2025 @ 10AM—5PM",
    location: "DC 1351",
    type: "Competition",
    description: "Our inaugural trading competition — test your skills and compete for prizes!",
    tags: ["FALL 25"],
    pdfUrl: "/events/f25tradingcomp/f25tradingcomp.pdf",
    galleryImages: [
      { type: "image", src: "https://placehold.co/800x600?text=Competition+1", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Competition+2", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Competition+3", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Competition+4", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Competition+5", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Competition+6", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Competition+7", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Competition+8", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Competition+9", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Competition+10", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Competition+11", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Competition+12", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Competition+13", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Competition+14", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Competition+15", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Competition+16", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Competition+17", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Competition+18", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Competition+19", alt: "" },
      { type: "image", src: "https://placehold.co/800x600?text=Competition+20", alt: "" },
    ],
    rankings: [
      { rank: 1, name: "Alfred Zhang", score: 4.53587 },
      { rank: 2, name: "Tian yi Tong", score: 5.53265 },
      { rank: 3, name: "Joey Xu", score: 6.13033 },
      { rank: 4, name: "David Shi", score: 6.95896 },
      { rank: 5, name: "Adam Kamel", score: 7.78046 },
      { rank: 6, name: "David Gan", score: 7.84710 },
      { rank: 7, name: "Andrej Ohrablo", score: 8.28348 },
      { rank: 8, name: "Leonardo Zhou", score: 8.48545 },
      { rank: 9, name: "Aadya Khanna", score: 8.57984 },
      { rank: 10, name: "Wilson Feng", score: 9.72621 },
    ],
  },
  {
    title: "Options 101",
    date: "Nov 19, 2025 @ 6:00PM",
    location: "RCH 302",
    type: "Workshop",
    description: "An introduction to options trading — calls, puts, volatility and all the greeks.",
    tags: ["FALL 25", "RECORDING"],
    galleryImages: [
      {
        type: "video",
        src: "https://www.youtube.com/embed/gp9hxfE0Eag",
        alt: "Options 101 Recording",
      },
      {
        type: "image",
        src: "https://placehold.co/800x600?text=Options+1",
        alt: "",
      },
      {
        type: "image",
        src: "https://placehold.co/800x600?text=Options+2",
        alt: "",
      },
      {
        type: "image",
        src: "https://placehold.co/800x600?text=Options+3",
        alt: "",
      },
    ],
    slideDeckUrl:
      "https://docs.google.com/presentation/d/e/2PACX-1vTNgHHSZist8YCaOyQC-K4o4Tfatl_mSsLC5wOLD53CuYTZwlgLGbA6sZQhyYkiTw/pub?start=true&loop=true&delayms=3000",
  },
  {
    title: "Asset Class Deep Dive",
    date: "Nov 12, 2025 @ 6:00PM",
    location: "RCH 302",
    type: "Workshop",
    description: "A survey of all other asset classes — exploring fixed income, equities, commodities, and more.",
    tags: ["FALL 25", "RECORDING"],
    galleryImages: [
      {
        type: "video",
        src: "https://www.youtube.com/embed/c71du1u3bHs",
        alt: "Assets Deep Dive Recording",
      },
    ],
    slideDeckUrl:
      "https://docs.google.com/presentation/d/e/2PACX-1vQ7GpETs4fUtfHzZbjVFOGptAzHMG7eEj7R8GsTZavWIEHOw9mDiRp6alIid1n9sQ/pub?start=true&loop=true&delayms=3000",
  },
  {
    title: "Intro to Trading",
    date: "Oct 29, 2025 @ 6:00PM",
    location: "RCH 302",
    type: "Workshop",
    description:
      "An introductory workshop on trading and market structure — covering market making terminology, order book mechanics, and real trade examples.",
    tags: ["FALL 25", "RECORDING"],
    galleryImages: [
      {
        type: "video",
        src: "https://www.youtube.com/embed/M22fNi8o8W4",
        alt: "Intro to Trading Workshop Recording",
      },
    ],
    slideDeckUrl:
      "https://docs.google.com/presentation/d/e/2PACX-1vRnTRrNVTQMUFj-O4AZfgDedyvpwU4vtPN127ogpsayu4JB19xMl6C-9_Yr3_B2XQ/pub?start=false&loop=false&delayms=3000",
  },
  {
    title: "Intro to Quant Panel",
    date: "Oct 8, 2025 @ 7:30PM",
    location: "RCH 302",
    type: "Panel",
    description:
      "We kicked off the term with our Intro to Quant Panel! Students who've worked at companies such as Jane Street, SIG, HRT, and Point72 shared their experiences, gave insight into the industry, and answered questions live.",
    tags: ["FALL 25"],
    galleryImages: [
      {
        type: "image",
        src: "https://placehold.co/800x600?text=Q%26A+Session",
        alt: "Q&A Session",
      },
      {
        type: "image",
        src: "https://placehold.co/800x600?text=Event+Crowd",
        alt: "Event Crowd",
      },
      {
        type: "image",
        src: "https://placehold.co/800x600?text=Harry+Jiang",
        alt: "Harry Jiang: QT @ Jane Street",
      },
      {
        type: "image",
        src: "https://placehold.co/800x600?text=Waterloo+Quant+Club",
        alt: "Waterloo Quant Club Execs",
      },
      {
        type: "image",
        src: "https://placehold.co/800x600?text=John+Huang",
        alt: "John Huang: QR at Cubist",
      },
      {
        type: "image",
        src: "https://placehold.co/800x600?text=Daniel+Shen",
        alt: "Daniel Shen: QT @ SIG",
      },
      {
        type: "image",
        src: "https://placehold.co/800x600?text=Ian+Zhao",
        alt: "Ian Zhao: SWE @ HRT",
      },
    ],
    slideDeckUrl:
      "https://docs.google.com/presentation/d/e/2PACX-1vS7seVvgi7gQe6Hi9w4Hn2Zcz0Bn_DhC_uyaCH_R-Ag72rlg4SgWQegLVj1m5OX4g/pub?start=false&loop=false&delayms=3000",
  },
];

export { Events };

/** Every tag in use, in first-seen order — handy for filter chips. */
export const EVENT_TAGS: readonly string[] = [
  ...new Set(Events.flatMap((event) => event.tags)),
];

// ---------------------------------------------------------------------------
// Fake API layer
// ---------------------------------------------------------------------------

/** Pretend network latency, in ms. Set to 0 in tests if it gets annoying. */
export const FAKE_LATENCY_MS = 250;

/** Stable slug derived from the title — safe as a React key or route param. */
export function eventSlug(event: EventData): string {
  return event.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface EventQuery {
  type?: EventType;
  /** Exact tag match, e.g. "RECORDING". */
  tag?: string;
  /** Case-insensitive match against title, description, location, type, tags. */
  search?: string;
  /** "upcoming" and "past" are relative to `now` (defaults to Date.now()). */
  status?: "upcoming" | "past" | "all";
  /** Sorts by parsed date. Omit to keep the curated order of `Events`. */
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface EventsResponse {
  data: EventData[];
  /** Matches before limit/offset were applied. */
  total: number;
  limit: number;
  offset: number;
}

export class EventNotFoundError extends Error {
  readonly status = 404;
  constructor(public readonly slug: string) {
    super(`No event with slug "${slug}"`);
    this.name = "EventNotFoundError";
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function matchesSearch(event: EventData, needle: string): boolean {
  const q = needle.trim().toLowerCase();
  if (!q) return true;
  return [
    event.title,
    event.description,
    event.location,
    event.type,
    ...event.tags,
  ].some((field) => field.toLowerCase().includes(q));
}

/** GET /events — preserves the curated order of `Events` (newest first). */
export async function fetchEvents(query: EventQuery = {}): Promise<EventsResponse> {
  await delay(FAKE_LATENCY_MS);

  const {
    type,
    tag,
    search,
    status = "all",
    order,
    limit = Events.length,
    offset = 0,
  } = query;

  const now = new Date();

  const matches = Events.filter((event) => {
    if (type && event.type !== type) return false;
    if (tag && !event.tags.includes(tag)) return false;
    if (search && !matchesSearch(event, search)) return false;
    if (status === "upcoming" && !isUpcoming(event, now)) return false;
    if (status === "past" && isUpcoming(event, now)) return false;
    return true;
  });

  if (order) {
    matches.sort((a, b) => {
      const diff =
        (parseEventDate(a.date)?.getTime() ?? 0) -
        (parseEventDate(b.date)?.getTime() ?? 0);
      return order === "asc" ? diff : -diff;
    });
  }

  return {
    data: matches.slice(offset, offset + limit),
    total: matches.length,
    limit,
    offset,
  };
}

/** GET /events/:slug — rejects with EventNotFoundError, like a 404 would. */
export async function fetchEvent(slug: string): Promise<EventData> {
  await delay(FAKE_LATENCY_MS);
  const event = Events.find((e) => eventSlug(e) === slug);
  if (!event) throw new EventNotFoundError(slug);
  return event;
}

/** GET /events/types */
export async function fetchTypes(): Promise<EventType[]> {
  await delay(FAKE_LATENCY_MS);
  return [...EVENT_TYPES];
}

// ---------------------------------------------------------------------------
// Date helpers
//
// `EventData.date` is a display string, not an ISO timestamp. Anything that
// needs real dates (calendar views, upcoming/past splits, sorting) goes
// through `parseEventDate` rather than adding a second date field.
// ---------------------------------------------------------------------------

/**
 * Parses the display date, e.g.
 *   "January 28, 2026 @ 6:00PM" → Jan 28 2026, 18:00 local
 *   "Nov 22, 2025 @ 10AM—5PM"   → Nov 22 2025, 10:00 local (range start)
 *   "Jan 14, 2026 @ 6-8pm"      → Jan 14 2026, 18:00 local (range start)
 *
 * Returns null when the string doesn't parse, so callers stay honest about it.
 */
export function parseEventDate(date: string): Date | null {
  const [datePart, timePart = ""] = date.split("@").map((part) => part.trim());

  const parsed = new Date(`${datePart} 00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  const time = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i.exec(timePart);
  if (time) {
    // "6-8pm" leaves the first number bare — fall back to the range's meridiem.
    const meridiem = (time[3] ?? /(am|pm)/i.exec(timePart)?.[1])?.toLowerCase();
    let hours = Number(time[1]);
    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
    parsed.setHours(hours, Number(time[2] ?? 0), 0, 0);
  }

  return parsed;
}

/** Same calendar day in the viewer's local timezone. */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Unparseable dates count as past, so they never sit in "upcoming". */
export function isUpcoming(event: EventData, now: Date = new Date()): boolean {
  const start = parseEventDate(event.date);
  return start !== null && start.getTime() >= now.getTime();
}

export type EventStatus = "past" | "today" | "upcoming";

/**
 * Three-way status for calendar colouring. "today" wins over the other two,
 * so an event that already ended this evening still reads as current.
 */
export function getEventStatus(
  event: EventData,
  now: Date = new Date()
): EventStatus {
  const start = parseEventDate(event.date);
  if (start && isSameDay(start, now)) return "today";
  return isUpcoming(event, now) ? "upcoming" : "past";
}
