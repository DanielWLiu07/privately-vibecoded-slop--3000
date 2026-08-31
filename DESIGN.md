# WQC Events Page — Design Specification

**Working title:** *The Pit*
**Theme:** Tokyo Night, dealt onto a real 3D green-felt poker table
**Stack:** Vite · React 19 · TS · Tailwind v4 · shadcn/ui · three (WebGPU) · `blender-to-threejs`
**Scope:** `/events` — masthead, upcoming events, events archive with filters.

---

## 1. The concept

The page is a poker table under a dealer's lamp.

The **table is real** — a WebGPU surface painted by the same `feltMaterialGraph`
the portfolio casino uses, not a photo and not a CSS gradient. The **UI is Tokyo
Night**, dealt on top like cards and chips. Events are playing cards, categories
are suits, sponsors are the money on the table.

This is on-genre rather than costume: poker is where quant interview culture
actually lives — expected value, market making, reading a table. The design
leans on that and stops well short of a casino ad (§4).

### 1.1 The two-layer rule

| Layer | What it is | Who draws it |
|---|---|---|
| **0 — the table** | Felt, rail, betting line, lamp pool, card shadows | WebGPU canvas, `position: fixed`, behind everything, `pointer-events: none` |
| **1 — the game** | Every pixel of text, every control, every card | DOM, Tokyo Night tokens, shadcn |

**No text is ever drawn into layer 0, and layer 1 never fakes felt.** The 3D
layer is a *ground*; it carries mood and depth and nothing the user must read.
This is not a stylistic preference — §3.2 shows it is the only legible option.

**No compositor pass.** The portfolio prints its scene through the manga /
watercolour compositor. This page does not: a halftoned, bled, paper-grained
background behind body copy is unreadable. Layer 0 renders clean. This is the
single largest deviation from the portfolio's use of the library, and it is
deliberate.

---

## 2. Layer 0 — the felt

### 2.1 The surface is a disc and a graph, not a model

Per the pipeline's set-dressing rule, a table top is *one flat disc plus a
material graph*. The outline is shaped by a signed distance expressed as an
**equivalent radius**, so every band (felt → piping → rail → dry-brushed edge)
follows the same expression:

```
r = max(rc - feltR, chordZ - pz) + feltR      // D-shape: arc toward the viewer,
                                              // straight dealer edge at the back
rw = r + noise(xz, {scale: 0.9, detail: 1}) * 0.05   // brush wobble
```

The events page uses a **wide, shallow D** (`chordZ` well behind the arc centre)
so the straight dealer edge sits above the masthead and the arc sweeps under the
content column.

### 2.2 The felt material — reuse, do not re-author

`feltMaterialGraph` is imported from the library unchanged. It is a Blender node
graph: fibre noise, low-frequency mottling, a normal-driven lift, and a Layer
Weight rim that brightens the silhouette where fibres catch the light.

```
fibre  = mapRange(noise(objectPos, {scale: 90, detail: 3, roughness: 0.6}), 0..1 → 0.9..1.1,  clamp)
mottle = mapRange(noise(objectPos, {scale: 3,  detail: 2}),                 0..1 → 0.85..1.05, clamp)
lift   = mapRange(normalWorld.y,                                           -1..1 → 0.4..1.0,   clamp)
shade  = fibre * mottle * lift
col    = base * shade
rim    = layerWeight(0.5, 'facing')
out    = blend(rim * 0.35, col, col * (1.35, 1.30, 1.20))
```

**The only change we make is the base colour**, passed as the second argument.

| | Linear (Blender) | sRGB | Why |
|---|---|---|---|
| Library default | `0.10, 0.42, 0.24` | `#59ad86` | Generic baize |
| Portfolio table | `0.07, 0.30, 0.17` | `#4b9573` | Warmer, printed green |
| **WQC — "night felt"** | **`0.055, 0.28, 0.20`** | **`#42907c`** | Rotated cooler/bluer so it sits beside Tokyo Night's teal family instead of fighting it |

Shading envelope of that base, from the graph above:

| | `shade` | sRGB |
|---|---|---|
| Darkest (`0.9 × 0.85 × 0.40`) | 0.306 | `#235346` |
| **Typical (`1.0 × 0.95 × 0.85`)** | **0.807** | **`#3b8370`** |
| Brightest (`1.1 × 1.05 × 1.0`) | 1.155 | `#479a84` |

Set `fibreDetail: 1, mottleDetail: 1`. Each octave is a full Perlin lookup and
this is a full-viewport surface; the portfolio does the same on its table.

### 2.3 The dealer's lamp is what makes it Tokyo Night

A single `spotLamp(g)` cone multiplied into the felt colour with `lit()`, plus
exactly one real three light at the same position for the cards' cast shadows.

This is the whole reconciliation between a green table and a blue-violet theme,
and it is a measured one. Felt luminance falls with the lamp:

| Lamp gain | Felt | Card `#24283b` on it | vs Tokyo Night `#1a1b26` |
|---|---|---|---|
| 1.00 | `#3b8370` | **3.24** ✓ | 3.80 |
| 0.70 | `#316f5e` | 2.47 | 2.90 |
| 0.40 | `#245548` | 1.71 | 2.01 |
| **0.12** | **`#102e26`** | 1.00 | **1.17** |

**At the edge of the lamp pool the felt is luminance-indistinguishable from
Tokyo Night's own background.** The page therefore reads as a lit poker table at
the centre and as an ordinary Tokyo Night interface at the margins, with no seam
to design. Tokyo Night is simply what the felt looks like where the lamp doesn't
reach.

Consequences, both binding:

- **The lamp pool must cover the content column.** Cards sit only where gain ≥ 0.9,
  which keeps card-on-felt ≥ 3:1 — the WCAG boundary for a non-text UI edge.
- **The page gutters get gain ≤ 0.15**, so the felt dies into `#1a1b26` and the
  chrome at the edges is plain Tokyo Night.

Every lamp knob (`lampX/Y/Z/Cone/Blend/Range/Amb/Gain`) is already a uniform.

### 2.4 Table markings

Drawn *in the graph*, not in the DOM — these are the one exception to "no
content in layer 0", because they are scenery, not information.

| Marking | Spec |
|---|---|
| Betting line | Cream ring at `line × feltR`, ~0.03 wide, broken by `smoothStep(noise(scale 6), 0.32, 0.5)` so it reads dry-brushed |
| Piping seam | Cream, `feltR − 0.06 … feltR + 0.07`, 0.7 opacity |
| Rail | Oxblood leather `lin 0.34, 0.14, 0.11` (`#9e695d`) with grain noise and a crown highlight `0.75 + 0.5 × crown^1.5` across the padding roll |
| Outer edge | Two octaves of noise eating the alpha so the table breaks into blobs rather than fading on a gradient; alpha 0 beyond |

Cream on lit felt measures **4.23:1** at full lamp — legible, which is why the
markings may carry a word or two (`NO LIMIT`, the term name) and nothing more.

### 2.5 Tunables are uniforms, always

Anything a slider or gizmo can reach is `g.uniform`, never a compile-time
constant. A constant recompiles the WGSL on every tick — about a second each —
and a drag freezes the tab, which reads as a crash.

`g.uniform(name, initial)` **takes a scalar only.** A colour tunable is three
scalars recombined:

```ts
const base = g.combine(
  g.uniform('feltR', 0.055),
  g.uniform('feltG', 0.28),
  g.uniform('feltB', 0.20),
)
const felt = feltMaterialGraph(g, base, { fibreDetail: 1, mottleDetail: 1 })
```

Ship `?tune` (sliders → query string) and `?edit` (`SetEditor` gizmos → layout
JSON). Any later request of the form *"bigger / move it left / greener"* is
answered with the switch and the numbers baked afterwards — never with a guessed
edit and a screenshot round trip.

### 2.6 Integration — Vite specifics

The portfolio is Next/Turbopack; this project is Vite, so the failure modes differ.

```bash
npm i three @react-three/fiber
npm i -D @types/three
npm i blender-to-threejs@file:../../blender-to-threejs
```

```ts
// vite.config.ts — additions
resolve: {
  alias: { "@": path.resolve(__dirname, "./src") },
  dedupe: ["three"],                       // ← non-negotiable
},
optimizeDeps: { exclude: ["blender-to-threejs"] },
```

- **`three` is a peer dependency.** Two copies in one bundle means two TSL
  registries and a *blank material with no error*. `npm ls three` must show one.
  `dedupe` + `exclude` is what enforces that under Vite.
- Bump `three` and `@types/three` together; skew only surfaces in `vite build`.
- R3F v9 + WebGPU needs an async renderer factory:
  ```tsx
  <Canvas flat gl={async (props) => {
    const r = new WebGPURenderer({ canvas: props.canvas as HTMLCanvasElement })
    await r.init(); return r
  }} />
  ```
- **`flat` is mandatory.** R3F sets `ACESFilmicToneMapping` *after* the factory
  returns, silently. Measured through a flat quad, linear 0.05 comes back 0.0319
  and 0.8 comes back 0.7084 — crushed darks, rolled highlights, a 2.3× error in
  shadow. It looks exactly like a shader bug and it is not one. Verify the
  transfer function with a constant-value quad before debugging any shading.

---

## 3. Colour

### 3.1 Tokyo Night tokens (layer 1)

Dark-only. `color-scheme: dark`, no light variant authored.

**Surfaces** — `#16161e` gutter · `#1a1b26` ground · `#24283b` card ·
`#292e42` hover · `#3b4261` decorative border · `#414868` strong divider

**Text**

| Token | Hex | on `#1a1b26` | on `#24283b` |
|---|---|---|---|
| `--foreground` | `#c0caf5` | **10.59** AAA | **9.02** AAA |
| `--body-foreground` | `#a9b1d6` | **8.10** AAA | **6.90** AA |
| `--muted-foreground` | `#8b95bf` | **5.82** AA | **4.96** AA |
| ~~`comment`~~ | `#565f89` | 2.76 ✗ | 2.35 ✗ |

**Two corrections to the source theme.** Tokyo Night was built for syntax
highlighting, not UI chrome:

1. **Muted text is not `comment`.** `#565f89` is 2.35:1 on a card — unreadable.
   `--muted-foreground` is **`#8b95bf`**, half-way along `comment → fg`, at
   **4.96:1**. Same hue family, clears AA.
2. **Interactive borders are not `fg-gutter`.** `#3b4261` is 1.48:1 against a
   card, under the 3:1 that WCAG 1.4.11 requires for a control's boundary.
   Inputs and selects use `--input: #6b739b` (**3.16:1**). `#3b4261` stays for
   decorative rules, which are exempt.

**Card-vs-page separation is 1.17:1.** Cards are separated by their border, never
by luminance. On this page they additionally cast a real shadow onto the felt —
see §3.3.

### 3.2 The legibility law

Tokyo Night text measured directly on typical lit felt `#3b8370`:

| | | | | |
|---|---|---|---|---|
| `#c0caf5` **2.65** ✗ | `#a9b1d6` **2.03** ✗ | `#8b95bf` **1.46** ✗ | `#7aa2f7` **1.70** ✗ | `#7dcfff` **2.50** ✗ |
| `#bb9af7` **1.85** ✗ | `#ff9e64` **2.11** ✗ | `#e0af68` **2.14** ✗ | `#9ece6a` **2.34** ✗ | `#f7768e` **1.62** ✗ |

**Every single one fails.** There is no Tokyo Night colour that can be read on
lit felt, light or dark — the felt sits squarely in the middle of the luminance
range, so nothing escapes in either direction.

> **Law: no DOM text ever sits on bare felt.** Every word on this page is on a
> Tokyo Night surface — `#24283b` card, `#1a1b26` panel, or `#16161e` well.
> A "floating" caption over the table is not a style choice available to us.

The masthead therefore sits on a felt-inset panel (`#16161e` at 92%), not
directly on the canvas.

### 3.3 The casino bridge

Converted from `CASINO_PALETTE` (linear → sRGB) and reconciled with Tokyo Night:

| Casino ink | Linear | sRGB | Tokyo Night counterpart | Verdict |
|---|---|---|---|---|
| Gold | `0.82, 0.62, 0.20` | `#eace7c` | `#e0af68` | **1.30 apart — use the Tokyo Night one.** Gold is already in the theme |
| Red | `0.72, 0.10, 0.12` | `#dd5961` | `#f7768e` | 1.40 apart; TN red is pinker and scores 5.51 on card vs 3.94 — **use TN** |
| Paper | `0.96, 0.94, 0.88` | `#faf8f1` | — | Keep, but **layer 0 only** (table markings) |
| Green | `0.10, 0.42, 0.24` | `#59ad86` | — | Becomes the felt base, tuned per §2.2 |

The happy result: **the casino palette is already almost Tokyo Night.** Gold and
red collapse onto existing tokens, green becomes the ground, paper stays on the
table. No new UI colours are introduced by the theme at all.

Card shadows onto felt measure **1.76:1** — a soft contact shadow, correctly. It
adds depth; it is not what separates a card from the table. The border still is.

---

## 4. Restraint rules

The theme lives in the **ground, the suits and the chips**. It does not live in
the copy.

- No dollar signs, no "jackpot", "all in", "bet on yourself", "double down".
  Event titles and descriptions stay exactly as the club writes them.
- No slot-machine motion, no spinning reels, no coin sounds, no confetti.
- No chip *counts* as decoration where a real number belongs — a chip stack may
  illustrate the archive count, never replace the digits.
- The felt never appears behind long-form reading (the intro copy sits on a panel).

One flag worth raising with the club: some universities restrict gambling
imagery in club promotional material. The design degrades cleanly if that
applies — drop the suits to plain category dots and the felt to a dark teal
gradient, and the Tokyo Night layer is untouched.

---

## 5. Categories are suits

Four categories, four suits. The mapping uses **suit rank** (♠ > ♥ > ♦ > ♣) to
track how much the club stakes on each kind of event:

| Category | Suit | Hue | on card | Rationale |
|---|---|---|---|---|
| Competition | ♠ | `#c0caf5` | **9.02** | Highest suit, flagship events, the "black" suit inverted for a dark ground |
| Panel | ♥ | `#f7768e` | **5.51** | Red suit, people-shaped |
| Sponsor Event | ♦ | `#e0af68` | **7.28** | Red suit, and diamonds are the money on the table |
| Workshop | ♣ | `#73daca` | **8.75** | Lowest suit, the routine weekly event; tinted so it is not confused with ♠ |

The warm/cool split matches a real deck (♥♦ warm, ♠♣ cool) without pretending a
dark theme can print two suits in black.

`#7aa2f7` blue is **reserved for the primary action** and is never a suit, so the
filled Sign-up button is always the only blue thing on a card.

**Badge** — hue mixed 10% into the card, label in the pure accent:

```css
.badge-suit {
  background: color-mix(in srgb, var(--suit) 10%, var(--card));
  color: var(--suit);
  border: 1px solid color-mix(in srgb, var(--suit) 30%, transparent);
}
```

Measured label contrast on its own tint: ♠ 7.14 · ♥ 4.73 · ♦ 5.95 · ♣ 6.97 — all AA.
The tint is **10%, not 15%**: at 15% the heart lands on 4.34 and fails.
The **glyph is the redundant signal**, so category never depends on colour alone.

### 5.1 Status is chips

A separate axis, deliberately drawn from non-suit colours so the two never
collide. Chips are 14px discs with a dashed edge ring, always beside a text label.

| State | Chip | Denomination logic |
|---|---|---|
| Registration open | `#9ece6a` green | The $25 chip — come on in |
| Application required | `#414868` black, `#c0caf5` edge | The high-denomination chip: highest barrier |
| Closed / full | `#f7768e` red | — |
| Recording available | no chip — a `Play` glyph in `--muted-foreground` | Not a state of the table |

---

## 6. Typography

| Role | Family | Size / line | Weight | Colour |
|---|---|---|---|---|
| Masthead | Sans | `clamp(2rem, 1.4rem + 2vw, 2.5rem)` / 1.1 | 600 | `--foreground` |
| Section title | Sans | 24 / 32 | 600 | `--foreground` |
| Card title | Sans | 18 / 26 | 600 | `--foreground` |
| Description | Sans | 14.5 / 22 | 400 | `--body-foreground` |
| **Date / time** | **Mono** | 13 / 18 | 500 | `--foreground` |
| **Room** | **Mono** | 12.5 / 16 | 500 | `--muted-foreground` |
| Corner index | Mono | 12 / 14 | 700 | suit hue |
| Eyebrow | Mono | 11.5 / 16 | 600, `0.08em`, upper | `--muted-foreground` |

Sans **Inter**, mono **JetBrains Mono**, `font-variant-numeric: tabular-nums` on
every machine-readable value. Prose is sans; dates, rooms, counts and prize
figures are mono. On a felt-and-Tokyo-Night ground that mono column reads as both
a terminal and a card's index — which is the entire design in one detail.

---

## 7. Components

### 7.1 shadcn primitives

`button` · `card` · `badge` · `input` · `select` · `tabs` · `skeleton` · `separator`

```bash
npx shadcn@latest add button card badge input select tabs skeleton separator
```

Phase 2: `dialog` (event detail), `tooltip`, `sonner`.

### 7.2 The event card is a playing card

```
┌─────────────────────────────────────────┐
│ ♠  COMPETITION            ● Applications│   corner index + suit ⟷ chip
│                                         │
│ MAR 22, 2026 · 9AM—5PM                  │   mono, tabular
│ UNIVERSITY OF WATERLOO                  │   mono, muted
│                                         │
│ 2026 Waterloo Trading Competition       │   18/26 semibold
│                                         │
│ Canada's first international university  │  14.5/22, clamp 3 lines
│ trading competition. $10,000+ in prizes. │
│                                         │
│ ───────────────────────────────────────  │
│ [ Apply ]   [ Watch recording ]      ♠  │   footer + rotated corner index
└─────────────────────────────────────────┘
```

- **Corner indices**, top-left and bottom-right (rotated 180°), exactly like a
  real card: suit glyph + a one-letter category initial, in the suit hue, mono.
  This is the theme's strongest single move and costs nothing in legibility.
- Date above title: on an events page the date is the primary scanning key, and
  the mono block gives every card the same anchor.
- `border-radius: 12px`, `1px solid var(--border)`, inset top highlight
  `inset 0 1px 0 rgb(192 202 245 / 0.04)`, and a real drop shadow onto the felt
  `0 18px 40px -16px rgb(0 0 0 / 0.55)`.

**States**

| State | Treatment |
|---|---|
| Default | As above |
| Hover / focus-within | `#292e42`, border `#545c7e`, `translateY(-3px)` + shadow grows — the card lifts off the felt |
| **Next upcoming** | The face-up hole card: 2px `--primary` left border, blue 20% glow, eyebrow `NEXT UP` |
| Past (archive) | `opacity: .92`, suit badge drops to outline, no primary button |
| Skeleton | `Skeleton` at 40 / 30 / 70 / 100 / 100 / 55% width on `#292e42` |

**Buttons** — at most one filled primary per card. Sign up / Apply is
`bg-primary text-[#16161e]` (**7.14:1**); Watch recording is `outline`; Add to
calendar is `ghost`.

### 7.3 Existing components → target

| File | Change |
|---|---|
| `components/EventCard.tsx` | → `Card` composition + corner indices (§7.2) |
| `components/CategoryBadge.tsx` | → `Badge` with a cva `suit` variant; drop the `MODIFIER` map |
| `components/EventCards.tsx` | Keep grid + state branching; `Skeleton` for placeholders |
| `components/ArchiveFilters.tsx` | → `Input` + `Select`, items prefixed with their suit glyph |
| `components/CalendarSubscribe.tsx` | → `<Button variant="outline" asChild>` |
| `components/EventsIntro.tsx` | Wrap in the felt-inset panel (§3.2) |
| `components/Section.tsx` | Keep; add `Separator` |
| `components/PageHeader.tsx` | Keep; retype per §6 |
| `components/EventsArchive.tsx` / `UpcomingEvents.tsx` | Keep; wrap in `Tabs` |
| **`src/EventCards.tsx`** | **Delete.** Stale stub — and `App.tsx` imports *this* one, not `components/EventCards.tsx`, which is why the page currently renders only the words "Event Cards" |
| `src/App.tsx` | → `<FeltCanvas />` + `PageHeader` + `Tabs(Upcoming, Archive)` |

Tabs read `Upcoming` / `Archive`; the count suffix is mono (`Archive · 17`).
`useEvents` already returns `total`, so "Showing 6 of 17" is free.

---

## 8. Motion — the deal

One choreography, on first paint only.

1. **Felt paints in** — `revealMask` swept from the dealer position, `grow`
   driven by `growFromImpact(t)`. Reach tuned so the front crosses the viewport
   in ~2s: `front = grow × reach / (0.42 × radial)`.
2. **Cards deal in** — staggered from the dealer edge, 60ms apart.

Rules that keep the deal from reading as machinery:

- **Per-card variation comes from a deterministic hash of (index, channel)**,
  never `index % n`. Three values read as a pattern instantly; two read as one
  object breaking apart. Deterministic, not random — the beat must reproduce.
- **Every animated term must evaluate to zero at t = 0**, rotation included. A
  phase-offset oscillator (`A·sin(ωt + φ)`) is `A·sin(φ)` on its first frame, so
  cards snap by 20–30° while their position stays perfectly smooth. Drop the
  phase; vary by rate and release time.
- Shadow catcher **below** the cards (cards `y + 0.004`, catcher `y + 0.001`) —
  2mm the other way and the catcher's region cuts a spike through every card.
- The catcher shares the felt's alpha through `compileNode`, same `grow` uniform
  on the same clock, or shadows fall on unpainted table.

| Interaction | Duration | Easing |
|---|---|---|
| Card hover lift | 150ms | ease-out |
| Button background | 120ms | ease-out |
| Tab swap | 200ms fade + 4px rise | ease-out |
| Deal stagger | 60ms/card, 420ms each | ease-out |

Judge motion by **sampling it**, not by stills: log `[t, position]` behind a
query switch and read the velocity profile. A run of exact zeroes is a freeze; a
single-frame spike is a discontinuity. Neither is visible in a contact sheet.

`prefers-reduced-motion: reduce` → no deal, no reveal; felt renders at `grow = 1`
and cards are simply present.

---

## 9. Performance & degradation

| Lever | Setting |
|---|---|
| `renderScale` | **0.6–0.8.** The felt is noise; it hides the downscale completely |
| Noise octaves | `fibreDetail: 1, mottleDetail: 1` — each octave is a full Perlin lookup over a full-viewport surface |
| Heavy node bodies | Emitted as WGSL **functions** (`Fn` + `setLayout`), never inlined. Inlining ten noise lookups produced an ~80-mix expression that took Metal **41 seconds** to compile and looked like a frozen tab; as a function, 55ms, bit-identical |
| Canvas | Pauses on `visibilitychange` and when scrolled out of view |
| Cursor / title / scroll-lock | **One writer per shared global.** Several per-frame writers means the last one wins and the effect silently disappears |

Diagnosing a stall: `MTLCompilerService` pegged during a rAF hang is *shader
compile*, not JS and not GPU load.

**Degradation ladder** — the page is fully usable at every rung:

1. **No WebGPU** (`navigator.gpu` absent) → a baked PNG of the same graph as a
   CSS background, plus the Tokyo Night ground. Capture it from the library's own
   preview tooling so it is the same felt, not an approximation.
2. **Reduced motion** → canvas renders, deal does not.
3. **Canvas fails to init** → `#1a1b26` and a radial `#102e26` pool. Identical
   luminance to the felt's dark end, so nothing in layer 1 shifts.

Layer 1 never reads a value from layer 0. The felt can vanish entirely and the
events page is unchanged.

---

## 10. Accessibility

- [ ] **No DOM text on bare felt** (§3.2) — the binding rule
- [ ] Every text token ≥4.5:1 on its actual surface; `#565f89` banned as text
- [ ] Interactive borders ≥3:1 (`--input #6b739b` = 3.16)
- [ ] Cards sit only where lamp gain ≥ 0.9, keeping card-on-felt ≥ 3:1
- [ ] Category carried by **suit glyph + label**, never hue alone; chips always
      have text beside them
- [ ] Canvas is `aria-hidden="true"`, `pointer-events: none`, not focusable
- [ ] Cards are `<article>` with an `<h3>`; dates carry
      `<time dateTime={event.startsAt}>` beside the display label
- [ ] Loading grid `aria-busy="true"`; error state `role="alert"`
- [ ] `Select` keeps an explicit label through the shadcn swap
- [ ] Focus ring 2px `--ring` at 6.79:1, offset 2; hover styling duplicated on
      `focus-within`
- [ ] Suit glyphs are decorative (`aria-hidden`) — the category word is the label

---

## 11. Build order

1. ~~Tailwind v4 + `@/` alias + shadcn deps~~ — **already installed**
2. Paste §3.1 tokens into `src/index.css`; `npx shadcn@latest add …` (§7.1)
3. **Delete `src/EventCards.tsx`**, repoint `App.tsx` at `components/` — fixes
   the currently-blank page
4. Ship layer 1 **complete and themed on a flat `#1a1b26`**: suits, chips, cards,
   filters, tabs, states. The page must be finished and shippable before any 3D
   exists
5. Add `three` + R3F + the library (§2.6); `npm ls three` shows one copy
6. `FeltCanvas`: disc + `feltMaterialGraph` + `spotLamp`, no reveal, static
7. Tune the lamp pool against the content column with `?tune`; bake the numbers
8. Shadow catcher, card shadows, then the deal (§8)
9. Degradation ladder (§9) and the baked fallback PNG
10. `npm run check`

Step 4 is the important one. The 3D is an enhancement to a working page, never a
dependency of one.

---

## Appendix — measured values

Every ratio here was computed from the actual token values (WCAG 2.1 relative
luminance), and every linear→sRGB conversion from `CASINO_PALETTE` itself.

```
TEXT ON SURFACES
  #c0caf5 on #24283b   9.02  AAA
  #a9b1d6 on #24283b   6.90  AA
  #8b95bf on #24283b   4.96  AA      substituted for comment
  #565f89 on #24283b   2.35  FAIL    decorative only
  #6b739b on #24283b   3.16  AA-UI   substituted for fg-gutter
  #3b4261 on #24283b   1.48          decorative only
  #24283b on #1a1b26   1.17          border required
  #16161e on #7aa2f7   7.14  AAA     primary button label
  #7aa2f7 on #1a1b26   6.79  AA      focus ring

FELT  base lin(0.055, 0.28, 0.20) = #42907c
  darkest #235346 · typical #3b8370 · brightest #479a84
  card #24283b on typical felt          3.24   (≥3 required)
  cream #faf8f1 on typical felt         4.23   (table markings only)
  card shadow vs felt                   1.76   (contact shadow)
  felt at lamp 0.12 vs #1a1b26          1.17   (the seam disappears)
  ALL Tokyo Night text on felt          1.46 – 2.65   ALL FAIL

SUITS on #24283b
  ♠ #c0caf5  9.02   ♥ #f7768e  5.51   ♦ #e0af68  7.28   ♣ #73daca  8.75
  badge label on its own 10% tint
  ♠ 7.14 (#34384e)  ♥ 4.73 (#393043)  ♦ 5.95 (#373640)  ♣ 6.97 (#2c3a49)

CASINO_PALETTE  linear → sRGB
  black  0.07,0.07,0.07 → #4b4b4b     red   0.72,0.10,0.12 → #dd5961
  green  0.10,0.42,0.24 → #59ad86     gold  0.82,0.62,0.20 → #eace7c
  paper  0.96,0.94,0.88 → #faf8f1     rail  0.34,0.14,0.11 → #9e695d
```
