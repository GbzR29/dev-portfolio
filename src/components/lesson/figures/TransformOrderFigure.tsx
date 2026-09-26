"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { useStepper, stepAmount, StepperControls } from "../kit/Stepper";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// The same two operations applied in opposite orders. Rotation and scaling
// always pivot around the world origin, so doing them while the object still
// sits at the origin changes it "in place", and doing them after a translation
// swings or pulls the object relative to (0, 0).

type Pt = { x: number; y: number };
type Op =
  | { kind: "T"; x: number; y: number }
  | { kind: "R"; deg: number }
  | { kind: "S"; s: number };

/** Applies `amount` (0..1) of an operation to a point, around the origin. */
function applyOp(op: Op, amount: number, p: Pt): Pt {
  if (op.kind === "T") return { x: p.x + op.x * amount, y: p.y + op.y * amount };
  if (op.kind === "S") { const k = 1 + (op.s - 1) * amount; return { x: p.x * k, y: p.y * k }; }
  const r = (op.deg * amount * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
}

/** Where a model-space point ends up at progress p through `ops`. */
const pose = (ops: Op[], p: number, pt: Pt): Pt =>
  ops.reduce((acc, op, i) => applyOp(op, stepAmount(p, i + 1), acc), pt);

// ── Scenarios ─────────────────────────────────────────────────────────────────
const T: Op  = { kind: "T", x: 2, y: 0 };
const R: Op  = { kind: "R", deg: 60 };
const S: Op  = { kind: "S", s: 0.5 };

type Lane = {
  ops: Op[];                     // in the order they are APPLIED to the vertex
  title: [string, string];       // [key, fallback]
  steps: [string, string][];     // caption for each applied op
  code: string[];                // GLM lines, in the order they are WRITTEN
  matrix: string;
};

type Scenario = { id: string; label: [string, string]; a: Lane; b: Lane; takeaway: [string, string] };

const SCENARIOS: Scenario[] = [
  {
    id: "rt",
    label: ["figOrder_rtLabel", "Rotate + Translate"],
    a: {
      ops: [R, T],
      title: ["figOrder_rtA", "Rotate, then translate"],
      steps: [
        ["figOrder_rtA1", "Rotate 60° — still at the origin, so it spins in place"],
        ["figOrder_rtA2", "Translate (2, 0) — slides along world x"],
      ],
      code: [
        "model = translate(model, {2, 0, 0});",
        "model = rotate(model, radians(60), Z);",
      ],
      matrix: "T · R",
    },
    b: {
      ops: [T, R],
      title: ["figOrder_rtB", "Translate, then rotate"],
      steps: [
        ["figOrder_rtB1", "Translate (2, 0) — slides along world x"],
        ["figOrder_rtB2", "Rotate 60° — pivots around (0, 0), so it swings along an arc"],
      ],
      code: [
        "model = rotate(model, radians(60), Z);",
        "model = translate(model, {2, 0, 0});",
      ],
      matrix: "R · T",
    },
    takeaway: ["figOrder_rtTake",
      "Rotation always turns around the origin. Rotate first and the object spins on the spot; translate first and the same rotation carries it around the origin like the hand of a clock."],
  },
  {
    id: "st",
    label: ["figOrder_stLabel", "Scale + Translate"],
    a: {
      ops: [S, T],
      title: ["figOrder_stA", "Scale, then translate"],
      steps: [
        ["figOrder_stA1", "Scale ×0.5 — shrinks in place"],
        ["figOrder_stA2", "Translate (2, 0) — full distance, ends at (2, 0)"],
      ],
      code: [
        "model = translate(model, {2, 0, 0});",
        "model = scale(model, {0.5, 0.5, 0.5});",
      ],
      matrix: "T · S",
    },
    b: {
      ops: [T, S],
      title: ["figOrder_stB", "Translate, then scale"],
      steps: [
        ["figOrder_stB1", "Translate (2, 0) — slides along world x"],
        ["figOrder_stB2", "Scale ×0.5 — shrinks the distance to the origin too, ends at (1, 0)"],
      ],
      code: [
        "model = scale(model, {0.5, 0.5, 0.5});",
        "model = translate(model, {2, 0, 0});",
      ],
      matrix: "S · T",
    },
    takeaway: ["figOrder_stTake",
      "Scaling also measures from the origin. Scale after translating and the offset gets scaled with the object — it only travels half the distance."],
  },
];

// ── Drawing ───────────────────────────────────────────────────────────────────
const VW = 260, VH = 200;
const O  = { x: 62, y: 138 };        // screen position of the world origin
const U  = 46;                       // px per world unit
const sc = (p: Pt): Pt => ({ x: O.x + p.x * U, y: O.y - p.y * U });

// A small ship pointing along +x: asymmetric, so its orientation is readable.
const SHIP: Pt[] = [{ x: 0.62, y: 0 }, { x: -0.34, y: 0.34 }, { x: -0.14, y: 0 }, { x: -0.34, y: -0.34 }];

const COL_X     = "#ef4444";
const COL_Y     = "#22c55e";
const COL_PIVOT = "#f59e0b";

function Arrow({ a, b, color, w = 1.6, head = 6, dash, opacity = 1 }: {
  a: Pt; b: Pt; color: string; w?: number; head?: number; dash?: string; opacity?: number;
}) {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  if (len < 2) return null;
  const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
  const h = Math.min(head, len * 0.5);
  return (
    <g opacity={opacity}>
      <line x1={a.x} y1={a.y} x2={b.x - ux * h * 0.7} y2={b.y - uy * h * 0.7}
        stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} />
      <polygon fill={color} points={`${b.x},${b.y} ${b.x - ux * h - uy * h * 0.5},${b.y - uy * h + ux * h * 0.5} ${b.x - ux * h + uy * h * 0.5},${b.y - uy * h - ux * h * 0.5}`} />
    </g>
  );
}

/** Text on a small chip, so labels stay legible over grid lines and trails. */
function Label({ x, y, children, color = "var(--text-muted)", anchor = "start" }: {
  x: number; y: number; children: string; color?: string; anchor?: "start" | "middle" | "end";
}) {
  const w = children.length * 5.2 + 8;
  const rx = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  return (
    <g>
      <rect x={rx} y={y - 9} width={w} height={13} rx={3} fill="var(--code-bg)" opacity={0.9} />
      <text x={rx + 4} y={y + 0.5} fill={color} fontSize="8.5" fontFamily="monospace">{children}</text>
    </g>
  );
}

function LaneFigure({ lane, p }: { lane: Lane; p: number }) {
  const at = (pt: Pt, q = p) => sc(pose(lane.ops, q, pt));
  const centre  = pose(lane.ops, p, { x: 0, y: 0 });
  const active  = p > 0 && p < lane.ops.length ? Math.floor(p) : -1;   // op index in motion
  const op      = active >= 0 ? lane.ops[active] : null;
  const before  = active >= 0 ? pose(lane.ops, active, { x: 0, y: 0 }) : null;  // centre when this op began

  // Trail of the object's centre from the start to now
  const trail: string[] = [];
  const N = Math.max(2, Math.ceil(p * 30));
  for (let i = 0; i <= N; i++) { const s = at({ x: 0, y: 0 }, (p * i) / N); trail.push(`${s.x},${s.y}`); }

  const ship  = SHIP.map(pt => at(pt)).map(s => `${s.x},${s.y}`).join(" ");
  const ghost = SHIP.map(sc).map(s => `${s.x},${s.y}`).join(" ");
  const c = sc(centre);

  // Rotation guide: an arc around the origin from where this op started
  let rotGuide: React.ReactNode = null;
  if (op?.kind === "R" && before) {
    const r = Math.hypot(before.x, before.y);
    const amount = stepAmount(p, active + 1);
    if (r > 0.2) {
      const a0 = Math.atan2(before.y, before.x);
      const a1 = a0 + (op.deg * Math.PI / 180) * amount;
      const p0 = sc({ x: r * Math.cos(a0), y: r * Math.sin(a0) });
      const p1 = sc({ x: r * Math.cos(a1), y: r * Math.sin(a1) });
      const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
      rotGuide = (
        <g>
          <line x1={O.x} y1={O.y} x2={c.x} y2={c.y} stroke={COL_PIVOT} strokeWidth="1" strokeDasharray="3 3" />
          <path d={`M ${p0.x} ${p0.y} A ${r * U} ${r * U} 0 ${large} 0 ${p1.x} ${p1.y}`}
            fill="none" stroke={COL_PIVOT} strokeWidth="1.6" strokeDasharray="4 3" />
          <circle cx={O.x} cy={O.y} r={4.5} fill="none" stroke={COL_PIVOT} strokeWidth="1.6" />
          <Label x={O.x + 8} y={O.y + 16} color={COL_PIVOT}>pivot (0,0)</Label>
        </g>
      );
    } else {
      // At the origin: a small circular arrow around the ship
      rotGuide = (
        <g>
          <path d={`M ${c.x + 26} ${c.y} A 26 26 0 1 0 ${c.x + 18} ${c.y + 19}`}
            fill="none" stroke={COL_PIVOT} strokeWidth="1.5" strokeDasharray="4 3" />
          <Label x={c.x} y={c.y - 32} color={COL_PIVOT} anchor="middle">spins in place</Label>
        </g>
      );
    }
  }

  // Scale guide: the distance to the origin that shrinks with the object
  let scaleGuide: React.ReactNode = null;
  if (op?.kind === "S" && before && Math.hypot(before.x, before.y) > 0.2) {
    scaleGuide = (
      <g>
        <line x1={O.x} y1={O.y} x2={sc(before).x} y2={sc(before).y} stroke={COL_PIVOT}
          strokeWidth="1" strokeDasharray="2 3" opacity={0.5} />
        <Arrow a={sc(before)} b={c} color={COL_PIVOT} w={1.4} head={5} />
        <Label x={(O.x + c.x) / 2} y={O.y + 16} color={COL_PIVOT} anchor="middle">distance × 0.5</Label>
      </g>
    );
  }

  const xAxis = at({ x: 0.55, y: 0 }), yAxis = at({ x: 0, y: 0.55 });
  const done = p >= lane.ops.length;

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-auto select-none" role="img"
      aria-label={lane.title[1]}>
      {/* Grid */}
      {Array.from({ length: 6 }, (_, i) => i - 1).map(k => (
        <line key={`gx${k}`} x1={sc({ x: k, y: 0 }).x} y1={0} x2={sc({ x: k, y: 0 }).x} y2={VH}
          stroke="var(--code-line)" strokeWidth="1" />
      ))}
      {Array.from({ length: 5 }, (_, i) => i - 1).map(k => (
        <line key={`gy${k}`} x1={0} y1={sc({ x: 0, y: k }).y} x2={VW} y2={sc({ x: 0, y: k }).y}
          stroke="var(--code-line)" strokeWidth="1" />
      ))}

      {/* World axes */}
      <Arrow a={{ x: 8, y: O.y }} b={{ x: VW - 8, y: O.y }} color="var(--code-muted)" w={1.2} head={6} />
      <Arrow a={{ x: O.x, y: VH - 6 }} b={{ x: O.x, y: 8 }} color="var(--code-muted)" w={1.2} head={6} />
      <text x={VW - 12} y={O.y - 6} fill="var(--code-muted)" fontSize="9" fontFamily="monospace" textAnchor="end">x</text>
      <text x={O.x + 6} y={14} fill="var(--code-muted)" fontSize="9" fontFamily="monospace">y</text>
      {[1, 2, 3].map(k => (
        <text key={k} x={sc({ x: k, y: 0 }).x} y={O.y + 11} fill="var(--code-muted)" fontSize="7.5"
          fontFamily="monospace" textAnchor="middle">{k}</text>
      ))}

      {/* Where it started */}
      <polygon points={ghost} fill="none" stroke="var(--code-muted)" strokeWidth="1" strokeDasharray="3 2" opacity={0.7} />

      {/* Path so far */}
      {p > 0.01 && (
        <polyline points={trail.join(" ")} fill="none" stroke="var(--primary)" strokeWidth="1.4"
          strokeDasharray="1 4" strokeLinecap="round" opacity={0.9} />
      )}

      {rotGuide}
      {scaleGuide}

      {/* The object, with its own local axes */}
      <polygon points={ship} fill="var(--primary)" fillOpacity={0.3} stroke="var(--primary)"
        strokeWidth="1.6" strokeLinejoin="round" />
      <Arrow a={c} b={xAxis} color={COL_X} w={1.6} head={5} />
      <Arrow a={c} b={yAxis} color={COL_Y} w={1.6} head={5} />

      {done && (
        <Label x={c.x} y={c.y + 30} color="var(--text-main)" anchor="middle">
          {`ends at (${centre.x.toFixed(2)}, ${centre.y.toFixed(2)})`}
        </Label>
      )}
    </svg>
  );
}

function LanePanel({ lane, p, t, badge }: { lane: Lane; p: number; t: TrackTranslations; badge: string }) {
  const n = lane.ops.length;
  const running = p > 0 && p < n ? Math.floor(p) : -1;
  const doneUpTo = Math.floor(p + 1e-6);   // ops fully applied

  return (
    <div className="flex flex-col min-w-0">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-5 h-5 rounded-full bg-[var(--primary-low)] text-[var(--primary)] text-[10px] font-bold flex items-center justify-center">
          {badge}
        </span>
        <span className="text-[12px] font-semibold text-[var(--text-main)]">{tx(t, ...lane.title)}</span>
      </div>

      <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] overflow-hidden">
        <LaneFigure lane={lane} p={p} />
      </div>

      {/* Steps, in applied order */}
      <ol className="mt-2.5 space-y-1">
        {lane.steps.map((s, i) => {
          const state = running === i ? "run" : i < doneUpTo ? "done" : "todo";
          return (
            <li key={i} className={`flex gap-2 text-[11.5px] leading-snug transition-colors ${
              state === "run" ? "text-[var(--text-main)]" : state === "done" ? "text-[var(--text-muted)]" : "text-[var(--text-muted)] opacity-60"
            }`}>
              <span className={`flex-shrink-0 w-4 h-4 mt-px rounded-full text-[9px] font-bold flex items-center justify-center border ${
                state === "todo" ? "border-[var(--border)]" : "border-transparent bg-[var(--primary)] text-white"
              }`}>{i + 1}</span>
              <span>{tx(t, ...s)}</span>
            </li>
          );
        })}
      </ol>

      {/* Code, in written order — the last line written runs first */}
      <pre className="mt-2.5 text-[9.5px] font-mono rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] py-2 overflow-x-auto leading-relaxed">
        {lane.code.map((line, i) => {
          const opIndex = n - 1 - i;                 // written order is reversed
          const hot = running === opIndex;
          return (
            <div key={i} className={`px-3 flex gap-3 transition-colors ${hot ? "bg-[var(--primary-low)]" : ""}`}>
              <span className="text-[var(--code-text)] whitespace-pre">{line}</span>
              <span className={`ml-auto whitespace-pre ${hot ? "text-[var(--primary)] font-bold" : "text-[var(--code-muted)]"}`}>
                {`// runs ${opIndex === 0 ? "1st" : "2nd"}`}
              </span>
            </div>
          );
        })}
      </pre>
      <p className="mt-1.5 font-mono text-[10.5px] text-[var(--text-muted)]">
        model = <span className="text-[var(--text-main)] font-bold">{lane.matrix}</span>
        <span className="opacity-80"> · {tx(t, "figOrder_readRtl", "applied right → left")}</span>
      </p>
    </div>
  );
}

// ── Figure ────────────────────────────────────────────────────────────────────
export function TransformOrderFigure({ t }: { t?: TrackTranslations }) {
  const [sid, setSid] = useState(SCENARIOS[0].id);
  const sc_ = SCENARIOS.find(s => s.id === sid) ?? SCENARIOS[0];
  const st = useStepper(2, 1300);

  return (
    <FigureShell>

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figOrder_title", "Order Matters — Step by Step")}
        </span>
        <div className="flex gap-1.5">
          {SCENARIOS.map(s => (
            <button key={s.id} onClick={() => { setSid(s.id); st.restart(); }}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${
                sid === s.id
                  ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"
              }`}>
              {tx(t, ...s.label)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-5 space-y-4">
        <div className="grid gap-5 md:grid-cols-2">
          <LanePanel lane={sc_.a} p={st.p} t={t} badge="A" />
          <LanePanel lane={sc_.b} p={st.p} t={t} badge="B" />
        </div>

        <StepperControls s={st} labels={[
          tx(t, "figOrder_step0", "start"),
          tx(t, "figOrder_step1", "1st op"),
          tx(t, "figOrder_step2", "2nd op"),
        ]} />

        <figcaption className="text-[12.5px] text-[var(--text-muted)] leading-relaxed border-l-2 border-[var(--primary)]/50 pl-3">
          {tx(t, ...sc_.takeaway)}
        </figcaption>
      </div>
    </FigureShell>
  );
}
