/**
 * Placement is a numbers job, so it is answered with a switch rather than with
 * a guessed edit and a screenshot round trip.
 *
 * Every layout number below can be overridden from the query string
 * (`?camY=5.4&feltR=4.6`), and `?tune` puts a slider panel on the page that
 * prints the equivalent query string — so a setup you like is one paste away
 * from becoming the default in LAYOUT.
 *
 * These are all plain transforms and geometry sizes: nothing here recompiles a
 * shader, so dragging a slider is free. The moment a knob starts driving
 * something a material has to be rebuilt for, it belongs in a uniform instead.
 */

export interface Layout {
  camX: number;
  camY: number;
  camZ: number;
  fov: number;
  tgtY: number;
  feltR: number;
  titleY: number;
  titleZ: number;
  titleW: number;
  titleTilt: number;
  panelY: number;
  panelZ: number;
  panelW: number;
  panelTilt: number;
  cardY: number;
  cardZ: number;
  cardW: number;
  cardSpread: number;
  cardTilt: number;
  cardFan: number;
  chipX: number;
  chipZ: number;
  diceX: number;
  diceZ: number;
}

/**
 * The baked default — what the page ships with.
 *
 * Found with `?tune` against the real frame, not guessed. The camera is well
 * back and the fov wide because the canvas sits inside `max-w-5xl`, so it is
 * nearer 4:3 than the 2:1 these numbers were first sized for; a layout tuned
 * against the wrong aspect looks zoomed in and clips the title.
 */
export const LAYOUT: Layout = {
  camX: 0,
  camY: 6.2,
  camZ: 8.6,
  fov: 42,
  tgtY: 1.5,
  feltR: 4.4,
  titleY: 3.15,
  titleZ: -3.2,
  titleW: 3.5,
  titleTilt: -0.5,
  panelY: 1.72,
  panelZ: -1.2,
  panelW: 3.2,
  panelTilt: -0.55,
  cardY: 0.32,
  cardZ: 1.55,
  cardW: 1.12,
  cardSpread: 1.38,
  cardTilt: -0.98,
  cardFan: 0.13,
  chipX: 3.2,
  chipZ: -0.35,
  diceX: 2.0,
  diceZ: 2.35,
};

/** Sensible slider bounds, only for the knobs worth dragging. */
export const RANGES: Partial<Record<keyof Layout, [number, number]>> = {
  camX: [-4, 4],
  camY: [1, 10],
  camZ: [3, 14],
  fov: [18, 60],
  tgtY: [-1, 4],
  feltR: [2, 9],
  titleY: [0, 7],
  titleZ: [-7, 2],
  titleW: [1.5, 7],
  titleTilt: [-1.2, 0.4],
  panelY: [0, 5],
  panelZ: [-5, 3],
  panelW: [1.5, 6],
  panelTilt: [-1.2, 0.4],
  cardY: [0, 3],
  cardZ: [-2, 5],
  cardW: [0.6, 3],
  cardSpread: [0.6, 3.2],
  cardTilt: [-1.571, 0.2],
  cardFan: [-0.6, 0.6],
  chipX: [0, 6],
  chipZ: [-4, 4],
  diceX: [0, 6],
  diceZ: [-4, 5],
};

/** LAYOUT with any `?key=value` overrides from the URL applied. */
export function readLayout(search = typeof window === "undefined" ? "" : window.location.search): Layout {
  const q = new URLSearchParams(search);
  const out = { ...LAYOUT };
  for (const key of Object.keys(LAYOUT) as (keyof Layout)[]) {
    const raw = q.get(key);
    if (raw === null) continue;
    const n = Number(raw);
    if (Number.isFinite(n)) out[key] = n;
  }
  return out;
}

export const tuningOpen = (search = typeof window === "undefined" ? "" : window.location.search) =>
  new URLSearchParams(search).has("tune");

/** The query string that reproduces `l` — only the knobs that actually differ. */
export function layoutQuery(l: Layout): string {
  const parts = (Object.keys(LAYOUT) as (keyof Layout)[])
    .filter((k) => Math.abs(l[k] - LAYOUT[k]) > 1e-6)
    .map((k) => `${k}=${Number(l[k].toFixed(3))}`);
  return parts.length ? `?${parts.join("&")}` : "(matches the baked default)";
}
