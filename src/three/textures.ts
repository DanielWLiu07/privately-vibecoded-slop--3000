/**
 * Every surface in the events scene is DRAWN, not downloaded.
 *
 * No bitmaps ship with this page: the felt, the card stock, the event faces and
 * the chip faces are all canvases, so they cost nothing to fetch, scale to
 * whatever resolution the display asks for, and can be recoloured from the
 * palette below instead of from a texture edit. That is the same split the
 * casino deck uses — layout is data, drawing consumes it.
 *
 * The felt is an APPROXIMATE port of the Blender felt graph (two noise octaves,
 * fibre at high frequency times mottling at low, on the palette green, with a
 * facing-weighted rim). It is a canvas bake of that recipe rather than the
 * transpiled node graph: this page carries plain three, not the WebGPU/TSL
 * pipeline the graph compiles to, so the values are matched by eye against the
 * graph's own constants and the tag is approximate, not exact.
 */
import * as THREE from "three";
import { eventSlug, type EventData, type EventType } from "@/data";
import { loadKatieRoze, setKatieRoze } from "./katie-roze";

/* ------------------------------------------------------------------ palette */

/** The casino inks. Felt green and card red are the graph's own constants. */
export const PALETTE = {
  felt: "#1a6b3e",
  feltDeep: "#0f4527",
  paper: "#f6f2e6",
  paperShade: "#e4dcc6",
  ink: "#1a1a1a",
  red: "#b8181c",
  green: "#1a6b3e",
  gold: "#c8a227",
  blue: "#26456f",
} as const;

/** Four event types, four suits — a quant club's deck. */
export const TYPE_SUIT: Record<EventType, { suit: string; colour: string }> = {
  Panel: { suit: "♠", colour: PALETTE.ink },
  Workshop: { suit: "♣", colour: PALETTE.green },
  Competition: { suit: "♥", colour: PALETTE.red },
  "Sponsor Event": { suit: "♦", colour: PALETTE.gold },
};

/** What an event has to show, if anything — drives the card's footer line. */
export function eventMaterial(event: EventData): string | null {
  if (event.slideDeckUrl) return "Slides →";
  if (event.pdfUrl) return "Handout →";
  if (event.rankings?.length) return "Standings →";
  if (event.galleryImages?.length) return "Photos →";
  return null;
}

/**
 * The clear font — everything that has to be READ is set in this.
 *
 * Inter, because index.html already loads it: the canvas text then matches the
 * DOM text beside it instead of being a second, slightly different sans.
 *
 * It is a WEBFONT, which is the trap. A canvas draws with whatever is loaded at
 * the moment fillText runs, and silently substitutes the fallback if Inter has
 * not arrived — no error, just a page whose 3D type does not match its HTML
 * type. Every texture that sets words therefore goes through fontsReady().
 */
export const CLEAR_FONT =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

/**
 * Resolves once every face these textures draw with is actually usable.
 *
 * `document.fonts.ready` alone is not enough: it settles when the pending font
 * loads finish, and a face nothing has asked for yet is not pending. So the
 * weights are requested explicitly first.
 */
export async function fontsReady(): Promise<void> {
  if (typeof document === "undefined") return;
  await loadKatieRoze();
  try {
    await Promise.all([
      document.fonts.load('400 40px Inter'),
      document.fonts.load('500 40px Inter'),
      document.fonts.load('600 40px Inter'),
      document.fonts.load('700 40px Inter'),
    ]);
  } catch {
    /* a missing weight is not worth failing the scene over */
  }
  await document.fonts.ready;
}

/* -------------------------------------------------------------------- noise */

/**
 * Integer-lattice hash with 32-bit wrapping arithmetic.
 *
 * Deliberately NOT fract(sin(x) * 43758): that is not reproducible, and the
 * felt has to bake identically every load or the table changes character
 * between a screenshot and the page it is meant to document.
 */
function hash2(ix: number, iy: number, seed: number): number {
  let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Value noise on a wrapping lattice, so the felt tiles without a seam. */
function valueNoise(x: number, y: number, period: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = smooth(x - x0);
  const fy = smooth(y - y0);
  const wrap = (v: number) => ((v % period) + period) % period;
  const xa = wrap(x0);
  const xb = wrap(x0 + 1);
  const ya = wrap(y0);
  const yb = wrap(y0 + 1);
  const v00 = hash2(xa, ya, seed);
  const v10 = hash2(xb, ya, seed);
  const v01 = hash2(xa, yb, seed);
  const v11 = hash2(xb, yb, seed);
  return (
    v00 * (1 - fx) * (1 - fy) + v10 * fx * (1 - fy) + v01 * (1 - fx) * fy + v11 * fx * fy
  );
}

/** fBm, matching the graph's `detail` as octave count and `roughness` as gain. */
function fbm(x: number, y: number, period: number, octaves: number, roughness: number, seed: number) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let p = period;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise((x * p) / period, (y * p) / period, p, seed + o * 101) * amp;
    norm += amp;
    amp *= roughness;
    p *= 2;
  }
  return sum / norm;
}

/** Blender's Map Range with clamp — order-aware, which is the part usually got wrong. */
const mapRange = (v: number, fromMin: number, fromMax: number, toMin: number, toMax: number) => {
  const t = Math.min(1, Math.max(0, (v - fromMin) / (fromMax - fromMin)));
  return toMin + t * (toMax - toMin);
};

/* ------------------------------------------------------------------ helpers */

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d");
  if (!x) throw new Error("2d context unavailable");
  return { c, x };
}

function finish(c: HTMLCanvasElement, repeat = false): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 16;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
  }
  t.needsUpdate = true;
  return t;
}

/** Word-wrap `text` into lines that fit `maxWidth`, using the context's current font. */
function wrap(x: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (x.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(x: CanvasRenderingContext2D, l: number, t: number, w: number, h: number, r: number) {
  x.beginPath();
  x.moveTo(l + r, t);
  x.arcTo(l + w, t, l + w, t + h, r);
  x.arcTo(l + w, t + h, l, t + h, r);
  x.arcTo(l, t + h, l, t, r);
  x.arcTo(l, t, l + w, t, r);
  x.closePath();
}

/** Paper grain, drawn straight into an existing context. */
function grain(x: CanvasRenderingContext2D, w: number, h: number, strength: number, seed: number) {
  const img = x.getImageData(0, 0, w, h);
  const d = img.data;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const n = fbm(px / 3, py / 3, 64, 2, 0.5, seed) - 0.5;
      const i = (py * w + px) * 4;
      const k = 1 + n * strength;
      d[i] = Math.min(255, d[i] * k);
      d[i + 1] = Math.min(255, d[i + 1] * k);
      d[i + 2] = Math.min(255, d[i + 2] * k);
    }
  }
  x.putImageData(img, 0, 0);
}

/* --------------------------------------------------------------------- felt */

/**
 * Green baize: fibre noise times mottling noise on the palette green.
 *
 * The graph's numbers, carried over: fibre is scale 90 / detail 3 /
 * roughness 0.6 mapped to 0.9..1.1, mottling is scale 3 / detail 2 /
 * roughness 0.5 mapped to 0.85..1.05, and the two multiply.
 */
export function feltTexture(size = 1024): THREE.CanvasTexture {
  const { c, x } = makeCanvas(size, size);
  const img = x.createImageData(size, size);
  const d = img.data;
  const base = new THREE.Color(PALETTE.felt);

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const u = px / size;
      const v = py / size;
      // fibre: high frequency, stretched slightly so it reads as a nap
      const fibre = mapRange(fbm(u * 190, v * 190 * 0.35, 190, 3, 0.6, 1), 0, 1, 0.9, 1.1);
      const mottle = mapRange(fbm(u * 4, v * 4, 4, 2, 0.5, 77), 0, 1, 0.85, 1.05);
      const k = fibre * mottle;

      /**
       * The edge is EATEN, not faded.
       *
       * The page shows through behind the table, so the felt has to stop
       * somewhere. A plain radial gradient reads as a vignette — a soft grey
       * halo that looks like a rendering fault. Two octaves of noise added to
       * the radius break the boundary into blobs and pinholes instead, which
       * reads as the edge of something laid down rather than as a fade.
       */
      const dx = u - 0.5;
      const dy = v - 0.5;
      const r = Math.hypot(dx, dy) * 2; // 0 at centre, 1 at the inscribed edge
      const wobble = (fbm(u * 7, v * 7, 7, 2, 0.55, 313) - 0.5) * 0.26;
      const alpha = mapRange(r + wobble, 0.94, 0.66, 0, 1);

      const i = (py * size + px) * 4;
      d[i] = Math.min(255, base.r * 255 * k);
      d[i + 1] = Math.min(255, base.g * 255 * k);
      d[i + 2] = Math.min(255, base.b * 255 * k);
      d[i + 3] = Math.round(alpha * 255);
    }
  }
  x.putImageData(img, 0, 0);
  return finish(c);
}

/* -------------------------------------------------------------------- title */

/**
 * "Events" in the watercolour face, tinted cream through the glyph alpha.
 *
 * Transparent everywhere else, so the plane it lands on reads as lettering
 * floating over the table rather than as a card with a word on it.
 */
export async function titleTexture(text = "Events", w = 2048, h = 768): Promise<THREE.CanvasTexture> {
  await loadKatieRoze();
  const { c, x } = makeCanvas(w, h);

  /**
   * The wash follows the PAGE, not the table.
   *
   * With a transparent background the word sits on the page behind the canvas,
   * so its colour has to be chosen against that and not against the felt. This
   * app ships `<html class="dark">`; a deep green wash disappeared completely
   * on it. Read the theme rather than assuming either one — the same title then
   * survives someone flipping the class.
   */
  const dark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  const tint = x.createLinearGradient(0, h * 0.15, 0, h * 0.9);
  if (dark) {
    tint.addColorStop(0, "#fbf6e9");
    tint.addColorStop(0.55, "#e9dcbb");
    tint.addColorStop(1, "#c9ad74");
  } else {
    tint.addColorStop(0, "#1d7346");
    tint.addColorStop(0.55, "#14522f");
    tint.addColorStop(1, "#12261b");
  }

  setKatieRoze(x, text, { size: h * 0.72, x: w / 2, y: h * 0.78, tint, align: "center" });
  return finish(c);
}

/* -------------------------------------------------------- the standing panel */

/**
 * The general info description, set in the clear font on card stock.
 *
 * This is the text the page is actually FOR, so it is drawn big, high contrast
 * and square to the camera. The linked phrases are marked in gold the way they
 * would be underlined in the DOM; the working links live in the markup beneath
 * the canvas, because a texture cannot be clicked or read by a screen reader.
 */
export function introTexture(paragraphs: readonly string[], w = 1280, h = 900): THREE.CanvasTexture {
  const { c, x } = makeCanvas(w, h);

  x.fillStyle = PALETTE.paper;
  x.fillRect(0, 0, w, h);
  grain(x, w, h, 0.05, 5);

  // a hairline rule inside the edge, the way a printed card is trimmed
  x.strokeStyle = "rgba(26,26,26,0.18)";
  x.lineWidth = 3;
  roundRect(x, 22, 22, w - 44, h - 44, 16);
  x.stroke();

  const pad = 76;
  let y = 132;

  x.fillStyle = PALETTE.ink;
  x.font = `600 30px ${CLEAR_FONT}`;
  x.letterSpacing = "3px";
  x.fillText("WATERLOO QUANTITATIVE FINANCE CLUB", pad, y);
  x.letterSpacing = "0px";

  y += 26;
  x.strokeStyle = PALETTE.gold;
  x.lineWidth = 4;
  x.beginPath();
  x.moveTo(pad, y);
  x.lineTo(pad + 210, y);
  x.stroke();

  y += 74;
  x.font = `400 40px ${CLEAR_FONT}`;
  for (const para of paragraphs) {
    for (const line of wrap(x, para, w - pad * 2)) {
      x.fillStyle = PALETTE.ink;
      x.fillText(line, pad, y);
      y += 56;
    }
    y += 26;
  }

  return finish(c);
}

/* -------------------------------------------------------------- event cards */

/** Poker proportion, 2.5 x 3.5 inches. */
export const CARD_ASPECT = 2.5 / 3.5;

/**
 * One event, printed as a playing card.
 *
 * The corner index is the category's suit, so the four kinds of event are
 * legible as a deck before a single word is read.
 */
export function eventCardTexture(event: EventData, w = 768): THREE.CanvasTexture {
  const h = Math.round(w / CARD_ASPECT);
  const { c, x } = makeCanvas(w, h);
  const { suit, colour } = TYPE_SUIT[event.type];

  x.fillStyle = PALETTE.paper;
  x.fillRect(0, 0, w, h);
  grain(x, w, h, 0.045, eventSlug(event).length);

  x.save();

  const pad = w * 0.085;

  // ---- corner index: suit + category, mirrored at the foot like a real card
  const index = (flip: boolean) => {
    x.save();
    if (flip) {
      x.translate(w, h);
      x.rotate(Math.PI);
    }
    x.fillStyle = colour;
    x.textAlign = "center";
    x.font = `700 ${Math.round(w * 0.095)}px Georgia, "Times New Roman", serif`;
    x.fillText(suit, pad + w * 0.028, pad + w * 0.085);
    x.font = `600 ${Math.round(w * 0.036)}px ${CLEAR_FONT}`;
    x.fillText(event.type.split(" ")[0].toUpperCase(), pad + w * 0.028, pad + w * 0.15);
    x.restore();
  };
  index(false);
  index(true);

  // ---- body
  x.textAlign = "left";
  const bodyL = pad + w * 0.115;
  const bodyW = w - bodyL - pad;
  let y = h * 0.3;

  x.fillStyle = colour;
  x.font = `700 ${Math.round(w * 0.042)}px ${CLEAR_FONT}`;
  x.letterSpacing = "2px";
  x.fillText(event.type.toUpperCase(), bodyL, y);
  x.letterSpacing = "0px";

  y += h * 0.055;
  x.fillStyle = PALETTE.ink;
  x.font = `700 ${Math.round(w * 0.072)}px ${CLEAR_FONT}`;
  const titleLines = wrap(x, event.title, bodyW);
  for (const line of titleLines.slice(0, 4)) {
    x.fillText(line, bodyL, y);
    y += w * 0.088;
  }

  y += h * 0.012;
  x.strokeStyle = "rgba(26,26,26,0.2)";
  x.lineWidth = 2;
  x.beginPath();
  x.moveTo(bodyL, y);
  x.lineTo(bodyL + bodyW, y);
  x.stroke();

  y += h * 0.048;
  x.fillStyle = "#4a463c";
  x.font = `500 ${Math.round(w * 0.045)}px ${CLEAR_FONT}`;
  for (const line of wrap(x, event.date, bodyW)) {
    x.fillText(line, bodyL, y);
    y += w * 0.06;
  }
  x.fillText(event.location, bodyL, y);

  // ---- footer: the term tags, then what the event left behind
  const footY = h - pad - w * 0.05;
  let tagX = bodyL;
  x.font = `700 ${Math.round(w * 0.032)}px ${CLEAR_FONT}`;
  for (const tag of event.tags.slice(0, 2)) {
    const tw = x.measureText(tag).width + w * 0.05;
    x.fillStyle = "rgba(26,26,26,0.08)";
    roundRect(x, tagX, footY - w * 0.115, tw, w * 0.058, w * 0.029);
    x.fill();
    x.fillStyle = "#4a463c";
    x.textAlign = "center";
    x.fillText(tag, tagX + tw / 2, footY - w * 0.074);
    x.textAlign = "left";
    tagX += tw + w * 0.026;
  }

  const material = eventMaterial(event);
  if (material) {
    x.fillStyle = colour;
    x.font = `700 ${Math.round(w * 0.044)}px ${CLEAR_FONT}`;
    x.fillText(material, bodyL, footY);
  }

  x.restore();
  return finish(c);
}

/** The back of the deck: a lattice in the club's green, the way a deck is printed. */
export function cardBackTexture(w = 512): THREE.CanvasTexture {
  const h = Math.round(w / CARD_ASPECT);
  const { c, x } = makeCanvas(w, h);
  x.fillStyle = PALETTE.paper;
  x.fillRect(0, 0, w, h);
  x.save();
  roundRect(x, w * 0.05, h * 0.035, w * 0.9, h * 0.93, w * 0.04);
  x.clip();
  x.fillStyle = PALETTE.green;
  x.fillRect(w * 0.05, h * 0.035, w * 0.9, h * 0.93);
  x.strokeStyle = "rgba(246,242,230,0.42)";
  x.lineWidth = 3;
  const step = w * 0.075;
  for (let i = -h; i < w + h; i += step) {
    x.beginPath();
    x.moveTo(i, 0);
    x.lineTo(i + h, h);
    x.moveTo(i, h);
    x.lineTo(i + h, 0);
    x.stroke();
  }
  x.fillStyle = "rgba(246,242,230,0.9)";
  x.textAlign = "center";
  x.font = `700 ${Math.round(w * 0.16)}px Georgia, serif`;
  x.fillText("WQC", w / 2, h / 2 + w * 0.055);
  x.restore();
  return finish(c);
}

/* --------------------------------------------------------------------- chip */

/** A chip face: the ring and the denomination, drawn the way the casino set draws them. */
export function chipFaceTexture(colour: string, label: string, w = 256): THREE.CanvasTexture {
  const { c, x } = makeCanvas(w, w);
  const r = w / 2;
  x.fillStyle = colour;
  x.beginPath();
  x.arc(r, r, r, 0, Math.PI * 2);
  x.fill();
  x.strokeStyle = PALETTE.paper;
  x.lineWidth = w * 0.055;
  x.beginPath();
  x.arc(r, r, r * 0.74, 0, Math.PI * 2);
  x.stroke();
  x.fillStyle = PALETTE.paper;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.font = `700 ${Math.round(w * 0.26)}px ${CLEAR_FONT}`;
  x.fillText(label, r, r);
  return finish(c);
}

/* --------------------------------------------------------------------- dice */

/**
 * Pip positions in unit face space, the arrangement a real die prints.
 *
 * A table rather than a formula for the same reason the card pips are: a five
 * laid out as a four plus a centre is right, and a six laid out as two columns
 * of three is right, but a six laid out as a five plus one is wrong to anyone
 * who has held a die.
 */
const DIE_PIPS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [
    [0.28, 0.28],
    [0.72, 0.72],
  ],
  3: [
    [0.26, 0.26],
    [0.5, 0.5],
    [0.74, 0.74],
  ],
  4: [
    [0.28, 0.28],
    [0.72, 0.28],
    [0.28, 0.72],
    [0.72, 0.72],
  ],
  5: [
    [0.27, 0.27],
    [0.73, 0.27],
    [0.5, 0.5],
    [0.27, 0.73],
    [0.73, 0.73],
  ],
  6: [
    [0.28, 0.24],
    [0.72, 0.24],
    [0.28, 0.5],
    [0.72, 0.5],
    [0.28, 0.76],
    [0.72, 0.76],
  ],
};

/** One face of a die: pips cut into bone-white stock. */
export function dieFaceTexture(value: number, w = 256): THREE.CanvasTexture {
  const { c, x } = makeCanvas(w, w);
  x.fillStyle = "#f4f1e8";
  x.fillRect(0, 0, w, w);
  grain(x, w, w, 0.05, value * 13);
  for (const [px, py] of DIE_PIPS[value] ?? []) {
    // a soft inner shadow reads as a pip cut IN rather than printed on
    const g = x.createRadialGradient(px * w, py * w - w * 0.012, w * 0.01, px * w, py * w, w * 0.082);
    g.addColorStop(0, "#111");
    g.addColorStop(0.72, "#1c1c1c");
    g.addColorStop(1, "#6b6b63");
    x.fillStyle = g;
    x.beginPath();
    x.arc(px * w, py * w, w * 0.082, 0, Math.PI * 2);
    x.fill();
  }
  return finish(c);
}

/**
 * The six faces in THREE's BoxGeometry material order (+x, -x, +y, -y, +z, -z),
 * with `top` showing upward. Opposite faces sum to seven, as they must.
 */
export function dieFaceTextures(top: number): THREE.CanvasTexture[] {
  const opposite = 7 - top;
  const ring = [2, 3, 5, 4].filter((v) => v !== top && v !== opposite);
  const [a, b] = ring.length >= 2 ? ring : [1, 6].filter((v) => v !== top && v !== opposite);
  return [a, 7 - a, top, opposite, b, 7 - b].map((v) => dieFaceTexture(v));
}

/** The chequered rim every casino chip has, as a strip around the cylinder. */
export function chipRimTexture(colour: string, w = 512, h = 64): THREE.CanvasTexture {
  const { c, x } = makeCanvas(w, h);
  x.fillStyle = colour;
  x.fillRect(0, 0, w, h);
  x.fillStyle = PALETTE.paper;
  const cells = 16;
  const cw = w / cells;
  for (let i = 0; i < cells; i += 2) x.fillRect(i * cw, 0, cw, h);
  return finish(c);
}
