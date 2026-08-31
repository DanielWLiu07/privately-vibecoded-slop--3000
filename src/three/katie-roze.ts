/**
 * The Katie Roze watercolour face, and the two traps that come with it.
 *
 * TRAP 1 — it is a SUBSET. The full face is ~24MB because every glyph carries
 * its own embedded watercolour artwork, so only the characters the site
 * actually sets are shipped (31 glyphs, 5.7MB). A character outside the subset
 * does NOT error: it silently falls back to the next font in the stack, and you
 * get a hard sans sitting next to a brush script. So the subset is checked
 * rather than assumed — `katieRozeMisses()` names the offending characters and
 * `setKatieRoze()` warns in dev.
 *
 *   "Events"          -> covered
 *   "Upcoming Events" -> MISSING U, c, m
 *   "Events Archive"  -> MISSING c, h
 *
 * That is why the 3D title is the single word "Events" and every other string
 * on the page is set in the clear font.
 *
 * TRAP 2 — the artwork is GREYSCALE. Measured through both a canvas and the
 * DOM, the rendered glyphs come back with exactly zero saturation: the wash,
 * the gradients and the dry-brush edges are all there, but there is no colour
 * in the file to recover. Colour therefore has to be applied by tinting THROUGH
 * the glyph alpha (`source-in`), which keeps the brush edges and the wash
 * shape. Setting fillStyle before fillText does nothing — the embedded raster
 * wins.
 */

export const KATIE_ROZE_FAMILY = "KatieRoze";
const FONT_URL = "/fonts/KatieRoze.woff2";

/** Exactly the characters present in public/fonts/KatieRoze.woff2 (read off its cmap). */
export const KATIE_ROZE_SUBSET = " &ACDEJKLMRSTWabefgilnoprstuvwy";

/** The characters of `text` that the subset cannot set, in first-seen order. */
export function katieRozeMisses(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const ch of text) {
    if (KATIE_ROZE_SUBSET.includes(ch) || seen.has(ch)) continue;
    seen.add(ch);
    out.push(ch);
  }
  return out;
}

let loading: Promise<boolean> | null = null;

/**
 * Load the face once. Resolves `false` when it cannot be loaded, so callers can
 * fall back rather than draw an invisible title.
 */
export function loadKatieRoze(): Promise<boolean> {
  if (loading) return loading;
  loading = (async () => {
    if (typeof document === "undefined" || !("FontFace" in window)) return false;
    try {
      const face = new FontFace(KATIE_ROZE_FAMILY, `url(${FONT_URL})`);
      await face.load();
      document.fonts.add(face);
      return true;
    } catch (err) {
      console.warn("[katie-roze] could not load the watercolour face:", err);
      return false;
    }
  })();
  return loading;
}

/**
 * Set `text` in Katie Roze on a 2D context, tinted through the glyph alpha.
 *
 * The tint is applied with `source-in` against the glyphs already drawn, which
 * is the only way to colour a greyscale raster face without flattening it: the
 * alpha carries the dry-brush edge, so the wash survives the recolour.
 *
 * Returns the drawn width so callers can centre without measuring twice.
 */
export function setKatieRoze(
  ctx: CanvasRenderingContext2D,
  text: string,
  opts: { size: number; x: number; y: number; tint?: string | CanvasGradient; align?: CanvasTextAlign },
): number {
  if (import.meta.env.DEV) {
    const missing = katieRozeMisses(text);
    if (missing.length) {
      console.warn(
        `[katie-roze] ${JSON.stringify(text)} needs ${JSON.stringify(missing.join(""))}, ` +
          `which is not in the shipped subset — those characters will render in the fallback face. ` +
          `Re-subset public/fonts/KatieRoze.woff2 from the original OTF, or set this string in the clear font.`,
      );
    }
  }

  const { size, x, y, tint, align = "left" } = opts;
  ctx.save();
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.font = `${size}px "${KATIE_ROZE_FAMILY}", Georgia, serif`;
  const width = ctx.measureText(text).width;
  ctx.fillText(text, x, y);
  if (tint) {
    // tint through the glyph alpha; anything already on the canvas outside the
    // glyphs is erased by source-in, so this only ever runs on its own layer
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
  ctx.restore();
  return width;
}
