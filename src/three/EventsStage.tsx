import {
  Suspense,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { eventSlug, type EventData } from "@/data";
import { useEvents } from "@/hooks/useEvents";
import { INTRO_PARAGRAPHS } from "@/components/EventsIntro";
import {
  CARD_ASPECT,
  PALETTE,
  cardBackTexture,
  chipFaceTexture,
  chipRimTexture,
  dieFaceTextures,
  eventCardTexture,
  eventMaterial,
  feltTexture,
  fontsReady,
  introTexture,
  titleTexture,
} from "./textures";
import { RANGES, layoutQuery, readLayout, tuningOpen, type Layout } from "./tune";

/**
 * The events hero as a 3D table: the club's standing blurb and its events,
 * dealt onto green baize.
 *
 * WHAT IS 3D AND WHAT IS NOT, and why.
 *
 * The title, the description and the featured events are in the scene. The
 * archive below stays in the DOM: it is a searchable, filterable list, and
 * search inputs, comboboxes and forty result cards are things the browser
 * already does better than a canvas can.
 *
 * Everything with a JOB - the prose, the dates, the links - also exists in the
 * markup underneath the canvas. A texture cannot be read by a screen reader,
 * focused with a keyboard, translated, or found with ctrl-F, so the 3D is the
 * presentation and the DOM copy is the content. Both read from the same
 * constants (INTRO_PARAGRAPHS, the same useEvents result) so they cannot drift.
 *
 * Two fonts, per the brief: the title is the Katie Roze watercolour face (see
 * katie-roze.ts for why it can only be the word "Events") and everything that
 * has to be READ is set in Inter, the face the page already loads.
 *
 * The background is transparent - no clear colour, no fog - so the table sits
 * on the page rather than in a box of its own. That is also why the felt is a
 * disc with a noise-eaten alpha edge instead of a plane: it has to end
 * somewhere inside the frame.
 */

/* ------------------------------------------------------------------- layout */

const LayoutCtx = createContext<Layout | null>(null);
const useLayout = (): Layout => {
  const l = useContext(LayoutCtx);
  if (!l) throw new Error("useLayout outside the stage");
  return l;
};

const CHIPS = [
  { colour: PALETTE.red, label: "5" },
  { colour: PALETTE.blue, label: "10" },
  { colour: PALETTE.ink, label: "25" },
  { colour: PALETTE.gold, label: "100" },
];

/* ---------------------------------------------------------------- textures */

/**
 * Build a canvas texture only once the fonts it draws with are usable, and
 * dispose it on the way out.
 *
 * Building in a useMemo draws immediately, which on a cold load means drawing
 * Inter before Inter exists - the canvas silently substitutes the fallback and
 * the 3D type stops matching the HTML type beside it. Nothing errors, so this
 * is only ever caught by looking.
 */
function useCanvasTexture(
  build: () => THREE.CanvasTexture | Promise<THREE.CanvasTexture>,
  deps: unknown[],
) {
  const [map, setMap] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    let dead = false;
    let made: THREE.CanvasTexture | null = null;
    void fontsReady()
      .then(() => build())
      .then((t) => {
        made = t;
        if (dead) t.dispose();
        else setMap(t);
      });
    return () => {
      dead = true;
      made?.dispose();
      setMap(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return map;
}

/* -------------------------------------------------------------- the cursor */

/**
 * One writer for document.body.style.cursor.
 *
 * Several cards each setting and clearing the cursor on their own hover fight
 * over the same single-slot global and the last writer wins, so the pointer
 * flickers or never appears. The stage counts claims and writes once.
 */
function useCursor() {
  const claims = useRef(0);
  useEffect(
    () => () => {
      document.body.style.cursor = "";
    },
    [],
  );
  return useMemo(
    () => ({
      claim(on: boolean) {
        claims.current = Math.max(0, claims.current + (on ? 1 : -1));
        document.body.style.cursor = claims.current > 0 ? "pointer" : "";
      },
    }),
    [],
  );
}

type Cursor = ReturnType<typeof useCursor>;

/* --------------------------------------------------------------------- felt */

/**
 * The table: a disc, NOT tiled.
 *
 * The texture carries its own noise-eaten alpha edge, so repeating it would
 * repeat the edge too. The felt therefore ends inside the frame and the page
 * shows through around it, which is the point of the transparent background.
 */
function Felt() {
  const { feltR } = useLayout();
  const map = useMemo(() => feltTexture(), []);
  useEffect(() => () => map.dispose(), [map]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[feltR, 96]} />
      <meshStandardMaterial map={map} transparent roughness={0.97} metalness={0} />
    </mesh>
  );
}

/* -------------------------------------------------------------------- title */

/** "Events" in the watercolour face. Unlit, so the lettering never dims. */
function Title() {
  const { titleY, titleZ, titleW, titleTilt } = useLayout();
  const map = useCanvasTexture(() => titleTexture("Events"), []);
  if (!map) return null;
  const h = (titleW * map.image.height) / map.image.width;
  return (
    <mesh position={[0, titleY, titleZ]} rotation={[titleTilt, 0, 0]}>
      <planeGeometry args={[titleW, h]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/* -------------------------------------------------------------------- panel */

/** The general info description, on card stock, turned to face the camera. */
function IntroPanel() {
  const { panelY, panelZ, panelW, panelTilt } = useLayout();
  const map = useCanvasTexture(() => introTexture(INTRO_PARAGRAPHS), []);
  if (!map) return null;
  const h = (panelW * map.image.height) / map.image.width;
  /**
   * A plane, not a box.
   *
   * Card stock has thickness, but a box gives the panel five more faces that
   * the pendant lamp never reaches, and at this angle they render as a black
   * slab sitting under the text — which reads as a bug, not as an edge. The
   * thickness was never visible anyway.
   *
   * It does not cast either. A tall flat panel under a single high lamp throws
   * a hard-edged rectangle across the felt, and at this angle that rectangle
   * sits right under the text and reads as a black slab bolted to the table —
   * worse than no contact shadow at all.
   */
  return (
    <mesh position={[0, panelY, panelZ]} rotation={[panelTilt, 0, 0]}>
      <planeGeometry args={[panelW, h]} />
      <meshBasicMaterial map={map} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* --------------------------------------------------------------- event card */

function EventCard({
  event,
  index,
  count,
  cursor,
}: {
  event: EventData;
  index: number;
  count: number;
  cursor: Cursor;
}) {
  const l = useLayout();
  const face = useCanvasTexture(() => eventCardTexture(event), [event]);
  const back = useMemo(() => cardBackTexture(), []);
  useEffect(() => () => back.dispose(), [back]);

  const group = useRef<THREE.Group>(null);
  const hovered = useRef(false);
  const lift = useRef(0);

  // centre the fan whatever the count is
  const mid = (count - 1) / 2;
  const offset = index - mid;
  const restX = offset * l.cardSpread;
  const restY = l.cardY - Math.abs(offset) * 0.04;
  const restZ = l.cardZ - Math.abs(offset) * 0.2;
  const yaw = -offset * l.cardFan;

  // what clicking the card opens: whatever the event actually left behind
  const href = event.slideDeckUrl ?? event.pdfUrl ?? null;

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    // exponential approach, framerate independent: no spring, no overshoot, and
    // continuous in velocity whichever way the pointer goes
    const k = 1 - Math.exp(-dt * 11);
    lift.current += ((hovered.current ? 1 : 0) - lift.current) * k;
    const a = lift.current;
    g.position.set(restX, restY + a * 0.3, restZ + a * 0.26);
    g.rotation.set(l.cardTilt + a * 0.26, yaw * (1 - a * 0.55), 0);
    g.scale.setScalar(1 + a * 0.05);
  });

  const enter = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (hovered.current) return;
    hovered.current = true;
    if (href) cursor.claim(true);
  };
  const leave = () => {
    if (!hovered.current) return;
    hovered.current = false;
    if (href) cursor.claim(false);
  };

  const w = l.cardW;
  const h = w / CARD_ASPECT;

  // after the hooks, never before: the face arrives a frame or two late and a
  // card with no map on it renders as a blank white slab
  if (!face) return null;

  return (
    <group ref={group} position={[restX, restY, restZ]} rotation={[l.cardTilt, yaw, 0]}>
      <mesh
        castShadow
        onPointerOver={enter}
        onPointerOut={leave}
        onClick={(e) => {
          e.stopPropagation();
          if (href) window.open(href, "_blank", "noopener,noreferrer");
        }}
      >
        <boxGeometry args={[w, h, 0.012]} />
        {[0, 1, 2, 3].map((i) => (
          <meshStandardMaterial
            key={i}
            attach={`material-${i}`}
            color={PALETTE.paper}
            roughness={0.9}
          />
        ))}
        <meshBasicMaterial attach="material-4" map={face} toneMapped={false} />
        <meshBasicMaterial attach="material-5" map={back} toneMapped={false} />
      </mesh>
    </group>
  );
}

function EventFan({ events, cursor }: { events: EventData[]; cursor: Cursor }) {
  return (
    <group>
      {events.map((event, i) => (
        <EventCard
          key={eventSlug(event)}
          event={event}
          index={i}
          count={events.length}
          cursor={cursor}
        />
      ))}
    </group>
  );
}

/* ----------------------------------------------------------------- dressing */

const CHIP_R = 0.26;
const CHIP_H = 0.058;

function ChipStack({
  colour,
  label,
  x,
  z,
  count,
}: {
  colour: string;
  label: string;
  x: number;
  z: number;
  count: number;
}) {
  const face = useCanvasTexture(() => chipFaceTexture(colour, label), [colour, label]);
  const rim = useMemo(() => chipRimTexture(colour), [colour]);
  const geo = useMemo(() => new THREE.CylinderGeometry(CHIP_R, CHIP_R, CHIP_H, 44), []);
  useEffect(
    () => () => {
      rim.dispose();
      geo.dispose();
    },
    [rim, geo],
  );
  if (!face) return null;
  return (
    <group position={[x, 0, z]}>
      {Array.from({ length: count }, (_, k) => (
        <mesh
          key={k}
          geometry={geo}
          castShadow
          receiveShadow
          // the small wobble is what stops a stack reading as one extruded cylinder
          position={[Math.sin(k * 2.3) * 0.006, CHIP_H / 2 + k * CHIP_H, Math.cos(k * 1.7) * 0.006]}
          rotation={[0, k * 0.43, 0]}
        >
          <meshStandardMaterial attach="material-0" map={rim} roughness={0.75} />
          <meshStandardMaterial attach="material-1" map={face} roughness={0.7} />
          <meshStandardMaterial attach="material-2" map={face} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Die({ value, x, z, spin }: { value: number; x: number; z: number; spin: number }) {
  const maps = useMemo(() => dieFaceTextures(value), [value]);
  useEffect(() => () => maps.forEach((m) => m.dispose()), [maps]);
  const s = 0.3;
  return (
    <mesh position={[x, s / 2, z]} rotation={[0, spin, 0]} castShadow receiveShadow>
      <boxGeometry args={[s, s, s]} />
      {maps.map((m, i) => (
        <meshStandardMaterial key={i} attach={`material-${i}`} map={m} roughness={0.55} />
      ))}
    </mesh>
  );
}

function Dressing() {
  const { chipX, chipZ, diceX, diceZ } = useLayout();
  return (
    <group>
      {CHIPS.map((c, i) => (
        <ChipStack
          key={`l${c.label}`}
          colour={c.colour}
          label={c.label}
          x={-chipX - (i % 2) * 0.58}
          z={chipZ + i * 0.46}
          count={5 - (i % 2)}
        />
      ))}
      {CHIPS.map((c, i) => (
        <ChipStack
          key={`r${c.label}`}
          colour={c.colour}
          label={c.label}
          x={chipX + (i % 2) * 0.58}
          z={chipZ + i * 0.46}
          count={4 + (i % 2)}
        />
      ))}
      <Die value={5} x={-diceX} z={diceZ} spin={0.42} />
      <Die value={2} x={-diceX + 0.46} z={diceZ + 0.22} spin={-0.66} />
      <Die value={6} x={diceX} z={diceZ + 0.08} spin={0.24} />
    </group>
  );
}

/* ---------------------------------------------------------------------- rig */

/** A pendant lamp over the table: one key that casts, plus enough fill to read by. */
function Rig() {
  const key = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    if (key.current) key.current.target = target;
  }, [target]);
  return (
    <>
      <ambientLight intensity={0.95} />
      <hemisphereLight args={["#dff0e4", "#0a1a12", 0.7]} />
      <primitive object={target} position={[0, 0, 0.6]} />
      <spotLight
        ref={key}
        position={[0, 8.4, 3.6]}
        angle={0.78}
        penumbra={0.8}
        intensity={320}
        distance={28}
        decay={2}
        color="#fff3d8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
      />
      <pointLight position={[-4.5, 3.2, 4.5]} intensity={26} distance={18} decay={2} color="#bfe3c9" />
    </>
  );
}

/** The camera the layout describes, plus slow parallax toward the pointer. */
function Camera() {
  const l = useLayout();
  const { camera, size } = useThree();
  const aim = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      aim.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      aim.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // fov and position come from the layout, so a tune drag moves the real camera
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = l.fov;
    cam.position.set(l.camX, l.camY, l.camZ);
    cam.updateProjectionMatrix();
  }, [camera, l.fov, l.camX, l.camY, l.camZ, size.width, size.height]);

  const look = useMemo(() => new THREE.Vector3(0, l.tgtY, 0), [l.tgtY]);
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 2.4);
    camera.position.x += (l.camX + aim.current.x * 0.7 - camera.position.x) * k;
    camera.position.y += (l.camY - aim.current.y * 0.38 - camera.position.y) * k;
    camera.lookAt(look);
  });
  return null;
}

/* -------------------------------------------------------------------- scene */

function Scene({ events, cursor }: { events: EventData[]; cursor: Cursor }) {
  return (
    <>
      {/*
        No <color attach="background"> and no fog on purpose: the canvas clears
        to transparent so the page behind shows through, and fog can only fade
        geometry TOWARD a colour, which would put a haze over a background that
        is meant to have none.
      */}
      <Rig />
      <Camera />
      <Felt />
      <Title />
      <IntroPanel />
      <Dressing />
      <EventFan events={events} cursor={cursor} />
    </>
  );
}

/* --------------------------------------------------------------- tune panel */

/** `?tune`: sliders for the layout, and the query string that reproduces it. */
function TunePanel({ layout, onChange }: { layout: Layout; onChange: (l: Layout) => void }) {
  const keys = Object.keys(RANGES) as (keyof Layout)[];
  return (
    <div className="absolute top-2 right-2 z-10 max-h-[92%] w-64 overflow-auto rounded-lg border bg-background/95 p-3 text-xs shadow-lg">
      <p className="mb-2 font-semibold">Layout</p>
      {keys.map((k) => {
        const [lo, hi] = RANGES[k]!;
        return (
          <label key={k} className="mb-1.5 flex items-center gap-2">
            <span className="w-20 shrink-0 font-mono">{k}</span>
            <input
              type="range"
              className="flex-1"
              min={lo}
              max={hi}
              step={(hi - lo) / 200}
              value={layout[k]}
              onChange={(e) => onChange({ ...layout, [k]: Number(e.target.value) })}
            />
            <span className="w-10 shrink-0 text-right font-mono">{layout[k].toFixed(2)}</span>
          </label>
        );
      })}
      <p className="mt-2 border-t pt-2 font-mono break-all opacity-80">{layoutQuery(layout)}</p>
    </div>
  );
}

/* -------------------------------------------------------------------- stage */

/** True when the browser can actually give us a WebGL context. */
function useWebGL(): boolean {
  const [ok] = useState(() => {
    if (typeof document === "undefined") return false;
    try {
      const c = document.createElement("canvas");
      return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
    } catch {
      return false;
    }
  });
  return ok;
}

export interface EventsStageProps {
  /**
   * How many events to deal onto the table.
   *
   * Taken from the head of the curated order, which `data.ts` keeps newest
   * first - deliberately NOT `status: "upcoming"`. Every event in the data set
   * has already happened, so an upcoming query returns nothing and the hero
   * would render as an empty table.
   */
  limit?: number;
}

export default function EventsStage({ limit = 3 }: EventsStageProps) {
  const cursor = useCursor();
  const webgl = useWebGL();
  const [layout, setLayout] = useState<Layout>(readLayout);
  const [tuning] = useState(tuningOpen);
  const { events, loading, error } = useEvents({ limit });

  /**
   * The scene runs only when there is a table to draw and a context to draw it
   * in. Otherwise the DOM copy below stops being a screen-reader affordance and
   * becomes the page itself, so it is shown rather than hidden - a browser with
   * no WebGL should get the events, not an empty green box.
   */
  const showScene = webgl && !loading && !error && events.length > 0;

  const content: ReactNode = (
    <div className={showScene ? "sr-only" : "space-y-4"}>
      <h1 id="events-title" className="text-4xl font-semibold tracking-tight">
        Events
      </h1>
      {INTRO_PARAGRAPHS.map((p) => (
        <p key={p.slice(0, 24)} className="max-w-2xl text-muted-foreground">
          {p}
        </p>
      ))}
      <ul className="space-y-1 text-sm">
        {events.map((event) => {
          const href = event.slideDeckUrl ?? event.pdfUrl;
          const material = eventMaterial(event);
          return (
            <li key={eventSlug(event)}>
              {href ? <a href={href}>{event.title}</a> : event.title} - {event.type},{" "}
              {event.location}, {event.date}
              {material ? ` - ${material.replace(" →", "")}` : ""}
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <section aria-labelledby="events-title">
      {showScene && (
        <div className="relative h-[min(86vh,46rem)] min-h-[30rem] w-full">
          <LayoutCtx.Provider value={layout}>
            <Canvas
              dpr={[1, 2]}
              shadows
              camera={{ position: [layout.camX, layout.camY, layout.camZ], fov: layout.fov }}
              gl={{ antialias: true, alpha: true }}
            >
              <Suspense fallback={null}>
                <Scene events={events} cursor={cursor} />
              </Suspense>
            </Canvas>
          </LayoutCtx.Provider>
          {tuning && <TunePanel layout={layout} onChange={setLayout} />}
        </div>
      )}

      {/*
        The content, in the markup. This is what a screen reader, a keyboard, a
        translator and ctrl-F all get; the canvas above is the presentation of
        exactly these strings. When the scene cannot run it stops being an
        affordance and becomes the page, so it is shown instead of hidden.
      */}
      {content}
    </section>
  );
}
