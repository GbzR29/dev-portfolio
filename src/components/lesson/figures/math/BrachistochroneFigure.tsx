"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, C, T, Handle, plot, clamp, nearest, useDrag, useFrame, useVisible, type Pt } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// The brachistochrone race. Four beads start at rest at A and slide without
// friction to B along four tracks: the straight line, a square-root curve
// (steep start), "drop then glide" and the cycloid, the curve the calculus of
// variations finds. Speed only depends on how far a bead has fallen,
// v = √(2gy), so a track that drops early gains speed early. Times are exact
// for the polyline tracks: on each straight piece the acceleration is constant,
// so the time is the length divided by the average of the end speeds.
// Drag B. When B is far to the side, the cycloid dips below B and climbs back.

type Track = "line" | "root" | "drop" | "cycloid";
const TRACKS: Track[] = ["line", "root", "drop", "cycloid"];
const COL: Record<Track, string> = { line: C.sky, root: C.purple, drop: C.orange, cycloid: C.green };
const G = 9.81, M = 400;
const W = 560, H = 300;
const pv = plot({ W, H, x0: -0.15, x1: 3.4, y0: -1.65, y1: 0.25 });
/** Depth d (metres below A) is drawn downwards. */
const X = pv.X, Y = (d: number) => pv.Y(-d);
const s2 = (v: number) => v.toFixed(3);

/** θ with (θ − sin θ)/(1 − cos θ) = ratio, by bisection on (0, 2π). */
function cycloidTheta(ratio: number) {
  let lo = 1e-6, hi = 2 * Math.PI - 1e-6;
  for (let i = 0; i < 80; i++) {
    const m = (lo + hi) / 2, v = (m - Math.sin(m)) / (1 - Math.cos(m));
    if (v < ratio) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}

type Run = { pts: Pt[]; cum: number[]; total: number; low: number };
function trackPoints(k: Track, b: Pt): Pt[] {
  const out: Pt[] = [];
  if (k === "cycloid") {
    const th = cycloidTheta(b.x / b.y), r = b.y / (1 - Math.cos(th));
    for (let i = 0; i <= M; i++) { const s = (th * i) / M; out.push({ x: r * (s - Math.sin(s)), y: r * (1 - Math.cos(s)) }); }
  } else if (k === "drop") {
    for (let i = 0; i <= M / 2; i++) out.push({ x: 0, y: (b.y * i) / (M / 2) });
    for (let i = 1; i <= M / 2; i++) out.push({ x: (b.x * i) / (M / 2), y: b.y });
  } else {
    for (let i = 0; i <= M; i++) { const u = i / M; out.push({ x: b.x * u, y: k === "line" ? b.y * u : b.y * Math.sqrt(u) }); }
  }
  return out;
}
function run(k: Track, b: Pt): Run {
  const pts = trackPoints(k, b), cum = [0];
  let low = 0;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], q = pts[i], ds = Math.hypot(q.x - p.x, q.y - p.y);
    const v0 = Math.sqrt(2 * G * Math.max(0, p.y)), v1 = Math.sqrt(2 * G * Math.max(0, q.y));
    cum.push(cum[i - 1] + (ds > 0 ? (2 * ds) / (v0 + v1) : 0));
    low = Math.max(low, q.y);
  }
  return { pts, cum, total: cum[cum.length - 1], low };
}
/** Where the bead is at time τ: constant acceleration inside each piece. */
function beadAt(r: Run, tau: number): Pt {
  if (tau >= r.total) return r.pts[r.pts.length - 1];
  let i = 1;
  while (r.cum[i] < tau) i++;
  const p = r.pts[i - 1], q = r.pts[i], dt = r.cum[i] - r.cum[i - 1];
  if (dt <= 0) return q;
  const v0 = Math.sqrt(2 * G * Math.max(0, p.y)), v1 = Math.sqrt(2 * G * Math.max(0, q.y));
  const s = tau - r.cum[i - 1], a = (v1 - v0) / dt, frac = (v0 * s + 0.5 * a * s * s) / (((v0 + v1) / 2) * dt);
  return { x: p.x + (q.x - p.x) * frac, y: p.y + (q.y - p.y) * frac };
}

function Stage({ b, setB, runs, tau, t }: { b: Pt; setB: (p: Pt) => void; runs: Record<Track, Run>; tau: number; t?: TrackTranslations }) {
  const drag = useDrag<"b">(
    q => nearest<"b">(q, [["b", { x: X(b.x), y: Y(b.y) }]], 20),
    (_, q) => { const w = pv.inv(q); setB({ x: clamp(w.x, 0.3, 3.2), y: clamp(-w.y, 0.35, 1.5) }); });
  const path = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join("");
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {[0.5, 1, 1.5].map(d => <line key={d} x1={0} x2={W} y1={Y(d)} y2={Y(d)} stroke={C.grid} strokeWidth={0.6} />)}
      {[1, 2, 3].map(x => <line key={x} x1={X(x)} x2={X(x)} y1={0} y2={H} stroke={C.grid} strokeWidth={0.6} />)}
      <line x1={0} x2={W} y1={Y(0)} y2={Y(0)} stroke={C.axis} strokeWidth={1} />
      <line x1={0} x2={W} y1={Y(b.y)} y2={Y(b.y)} stroke={C.muted} strokeWidth={0.8} strokeDasharray="3 4" />
      {TRACKS.map(k => <path key={k} d={path(runs[k].pts)} fill="none" stroke={COL[k]} strokeWidth={k === "cycloid" ? 2.4 : 1.8} opacity={0.9} />)}
      {TRACKS.map(k => { const p = beadAt(runs[k], tau); return <circle key={k} cx={X(p.x)} cy={Y(p.y)} r={6} fill={COL[k]} stroke={C.bg} strokeWidth={1.5} />; })}
      <circle cx={X(0)} cy={Y(0)} r={4} fill={C.fg} />
      <T x={X(0) + 6} y={Y(0) - 6} size={10.5} color={C.fg} bold>A</T>
      <Handle x={X(b.x)} y={Y(b.y)} color={C.amber} active={drag.dragging === "b"} />
      <T x={X(b.x) + 9} y={Y(b.y) - 8} size={10.5} color={C.amber} bold>B</T>
      <T x={W - 8} y={16} size={10} anchor="end">{fill(tx(t, "figBr_clock", "t = {t} s"), { t: tau.toFixed(2) })}</T>
    </svg>
  );
}

export function BrachistochroneFigure({ t }: { t?: TrackTranslations }) {
  const [b, setBRaw] = useState<Pt>({ x: 1.4, y: 1 });
  const [tau, setTau] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [raced, setRaced] = useState(false);
  const lab = useLab("math-brachistochrone");
  const vis = useVisible<HTMLDivElement>();

  const runs = useMemo(() => Object.fromEntries(TRACKS.map(k => [k, run(k, b)])) as Record<Track, Run>, [b]);
  const slowest = Math.max(...TRACKS.map(k => runs[k].total));
  const winner = TRACKS.reduce((w, k) => (runs[k].total < runs[w].total ? k : w), "line" as Track);
  const th = cycloidTheta(b.x / b.y), rr = b.y / (1 - Math.cos(th)), exact = th * Math.sqrt(rr / G);
  const dips = runs.cycloid.low > b.y + 1e-3;

  useFrame(playing && (vis.on || lab.open), dt => {
    const next = tau + dt * 0.5;
    if (next >= slowest) { setTau(slowest); setPlaying(false); setRaced(true); } else setTau(next);
  });
  const setB = (p: Pt) => { setBRaw(p); setTau(0); setPlaying(false); };

  const name: Record<Track, string> = {
    line: tx(t, "figBr_line", "straight line"),
    root: tx(t, "figBr_root", "steep start"),
    drop: tx(t, "figBr_drop", "drop then glide"),
    cycloid: tx(t, "figBr_cyc", "cycloid"),
  };
  const view = (
    <div ref={vis.ref}>
      <Stage b={b} setB={setB} runs={runs} tau={tau} t={t} />
      <Transport t={t} playing={playing}
        onPlay={() => { if (playing) { setPlaying(false); return; } if (tau >= slowest) setTau(0); setPlaying(true); }}
        playLabel={tx(t, "figBr_play", "release the beads")}
        onReset={() => { setPlaying(false); setTau(0); }}
        readout={tx(t, "figBr_slow", "half speed")} />
    </div>
  );
  const controls = <>
    <Row>
      {TRACKS.map(k => <Readout key={k} color={COL[k]}>{`${name[k]}: ${s2(runs[k].total)} s${k === winner ? ` (${tx(t, "figBr_fastest", "fastest")})` : ""}`}</Readout>)}
    </Row>
    <Row>
      <Readout>{fill(tx(t, "figBr_B", "B: {x} m across, {y} m down"), { x: b.x.toFixed(2), y: b.y.toFixed(2) })}</Readout>
      <Readout color={C.green}>{fill(tx(t, "figBr_exact", "cycloid by formula θ√(r/g) = {t} s"), { t: s2(exact) })}</Readout>
    </Row>
  </>;
  const note = tx(t, "figBr_note", "Four frictionless tracks from A to B, and a bead on each, released at the same moment (shown at half speed). A bead's speed depends only on how far it has dropped, v = √(2gy), so the question is how to spend the drop. The straight line is the shortest but accelerates slowly. Dropping straight down gains speed fastest but wastes distance. The cycloid, the curve traced by a point on a rolling wheel, is the exact best compromise. Drag B far to the right and the winning track even goes below B and climbs back up.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figBrL1_t", "The race"),
      body: <p>{tx(t, "figBrL1_b", "Guess which bead arrives first, then release them.")}</p>,
      goal: { text: tx(t, "figBrL1_g", "Run the race to the end."), done: raced },
      focus: "play",
      setup: () => { setB({ x: 1.4, y: 1 }); setRaced(false); },
    },
    {
      title: tx(t, "figBrL2_t", "Quick check"),
      body: <p>{tx(t, "figBrL2_b", "The straight line is the shortest track, yet it lost.")}</p>,
      quiz: {
        q: tx(t, "figBrL2_q", "Why can a longer track be faster?"),
        options: [tx(t, "figBrL2_o1", "it drops early, so the bead travels fast for most of the way"), tx(t, "figBrL2_o2", "gravity is stronger on curves"), tx(t, "figBrL2_o3", "there is less friction"), tx(t, "figBrL2_o4", "the bead is lighter on it")],
        answer: 0,
        why: tx(t, "figBrL2_w", "Speed is √(2gy) at depth y. Falling steeply at first buys speed that pays off over the rest of the trip; the cycloid balances that against the extra length."),
      },
    },
    {
      title: tx(t, "figBrL3_t", "Below the finish"),
      body: <p>{tx(t, "figBrL3_b", "Drag B far to the right and only a little below A. Watch the cycloid: it goes deeper than B and climbs back at the end.")}</p>,
      goal: { text: tx(t, "figBrL3_g", "A cycloid that dips below B."), done: dips },
    },
    {
      title: tx(t, "figBrL4_t", "Still the winner"),
      body: <p>{tx(t, "figBrL4_b", "Race again with B there. Climbing back costs speed, but the cycloid still wins: the extra depth made it fast in the middle.")}</p>,
      goal: { text: tx(t, "figBrL4_g", "A finished race with a dipping cycloid."), done: dips && raced && tau >= slowest - 1e-6 },
      focus: "play",
      setup: () => setRaced(false),
    },
    {
      title: tx(t, "figBrL5_t", "Quick check"),
      body: <p>{tx(t, "figBrL5_b", "The time along a track is T = ∫ ds / v with ds = √(1 + y′²) dx and v = √(2gy).")}</p>,
      quiz: {
        q: tx(t, "figBrL5_q", "Which L(y, y′) does the calculus of variations minimise here?"),
        options: ["√(1 + y′²) / √(2gy)", "√(1 + y′²)", "y′² / 2", "√(2gy)"],
        answer: 0,
        why: tx(t, "figBrL5_w", "Length element over speed: time. Minimising only √(1 + y′²) would give the straight line again."),
      },
    },
  ];
  const insights: Insight[] = [
    {
      id: "dip", tone: "info", when: dips,
      title: tx(t, "figBrI1_t", "Deeper than B"),
      body: tx(t, "figBrI1_b", "With B this far to the side, the fastest route goes below B: the extra speed is worth the climb at the end."),
    },
    {
      id: "check", tone: "ok", when: raced && winner === "cycloid",
      title: tx(t, "figBrI2_t", "The cycloid wins"),
      body: fill(tx(t, "figBrI2_b", "Measured along the track: {m} s; by the formula θ√(r/g): {f} s. The race and the theory agree."), { m: s2(runs.cycloid.total), f: s2(exact) }),
    },
  ];

  const title = tx(t, "figBr_title", "The brachistochrone race");
  return (
    <>
      <Figure fullscreen={false} title={title} head={<LabButton lab={lab} t={t} />} controls={controls} note={note}>
        {view}
      </Figure>
      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view} controls={controls}
        recap={[
          tx(t, "figBrR1", "The fastest track is not the shortest: dropping early buys speed."),
          tx(t, "figBrR2", "Minimising the time T = ∫ √(1 + y′²) / √(2gy) dx gives the cycloid."),
          tx(t, "figBrR3", "When B is far to the side, the cycloid goes below B and climbs back."),
        ]}
      />
    </>
  );
}
