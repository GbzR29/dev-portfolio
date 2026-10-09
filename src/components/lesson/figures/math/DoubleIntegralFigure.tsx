"use client";

import { useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Btn, C, f2, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { makeProjector, useOrbit, boxFaces, frontFacing, type V3, type Projector } from "@/components/lesson/kit/scene3d";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// The volume under a surface z = f(x, y) over the square 0 ≤ x, y ≤ 2.
// Boxes: the square is cut into n × n small squares and each carries a box as
// tall as f at its centre; the total volume of the boxes approaches the double
// integral as n grows (the Transport doubles n). Slices: the same volume cut
// into thin sheets at fixed x; each sheet's area A(x) = ∫ f(x, y) dy is an
// ordinary integral, and adding the sheets, ∫ A(x) dx, gives the volume again:
// an iterated integral. The Transport sweeps x and adds up the volume so far.
// The lab: boxes close in on 32/3, the inner integral of the plane, the
// biggest slice of the bump, then the slices adding up to the whole volume.

type Mode = "boxes" | "slices";
type Key = "plane" | "dome" | "bump";
const FNS: Record<Key, { label: string; f: (x: number, y: number) => number; exact: string }> = {
  plane: { label: "1 + xy/2", f: (x, y) => 1 + (x * y) / 2, exact: "6" },
  dome: { label: "4 − (x² + y²)/2", f: (x, y) => 4 - (x * x + y * y) / 2, exact: "32/3" },
  bump: { label: "3e^(−(x−1)²−(y−1)²)", f: (x, y) => 3 * Math.exp(-((x - 1) ** 2) - (y - 1) ** 2), exact: "" },
};
const W = 560, H = 320, K = 0.45;                 // K: height scale in the drawing
const N_MAX = 16, X_STEP = 0.25;
const toV = (x: number, y: number, z: number): V3 => [x - 1, z * K - 0.7, y - 1];
const pts = (p: Projector, q: V3[]) => q.map(v => p(v));
const d = (sp: { x: number; y: number }[]) => "M" + sp.map(s => `${s.x.toFixed(1)},${s.y.toFixed(1)}`).join("L") + "Z";

/** Midpoint sum with n × n boxes on [0, 2]². */
const midSum = (f: (x: number, y: number) => number, n: number) => {
  const h = 2 / n; let s = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += f((i + 0.5) * h, (j + 0.5) * h);
  return s * h * h;
};
const sliceArea = (f: (x: number, y: number) => number, x: number) => {
  const n = 200, h = 2 / n; let s = 0;
  for (let j = 0; j < n; j++) s += f(x, (j + 0.5) * h);
  return s * h;
};
/** ∫₀ˣ A(s) ds: the volume of the slices up to x. */
const volumeTo = (f: (x: number, y: number) => number, x: number) => {
  const n = 80, h = x / n; let s = 0;
  for (let i = 0; i < n; i++) s += sliceArea(f, (i + 0.5) * h);
  return s * h;
};

// ── The drawing ───────────────────────────────────────────────────────────────

/** The orbiting svg; owns its orbit (it is mounted twice while the lab is open). */
function DblStage({ mode, k, n, xs, t }: { mode: Mode; k: Key; n: number; xs: number; t?: TrackTranslations }) {
  const orb = useOrbit({ yaw: -0.6, pitch: 0.55, zoom: 1 });
  const fn = FNS[k];
  const proj = makeProjector(orb.orbit, W / 2, H / 2 - 10, 80, 9);

  const boxes: { sp: { x: number; y: number }[]; depth: number; fill: string }[] = [];
  if (mode === "boxes") {
    const h = 2 / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const z = fn.f((i + 0.5) * h, (j + 0.5) * h);
      const lo = toV(i * h, j * h, 0), hi = toV((i + 1) * h, (j + 1) * h, z);
      const c: V3 = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
      const half: V3 = [(hi[0] - lo[0]) / 2, Math.max(1e-3, (hi[1] - lo[1]) / 2), (hi[2] - lo[2]) / 2];
      for (const fc of boxFaces(c, half)) {
        const sp = pts(proj, fc.pts);
        if (!frontFacing(sp)) continue;
        const light = fc.normal[1] > 0.5 ? 58 : fc.normal[0] !== 0 ? 42 : 32;
        boxes.push({ sp, depth: sp.reduce((s, q) => s + q.depth, 0) / sp.length, fill: `hsl(200, 70%, ${light}%)` });
      }
    }
    boxes.sort((a, b) => b.depth - a.depth);
  }

  // Surface wireframe: lines of constant x and constant y
  const M = 12, mesh: string[] = [];
  for (let q = 0; q <= M; q++) {
    const u = (2 * q) / M;
    const row = Array.from({ length: 25 }, (_, s) => proj(toV(u, (2 * s) / 24, fn.f(u, (2 * s) / 24))));
    const col = Array.from({ length: 25 }, (_, s) => proj(toV((2 * s) / 24, u, fn.f((2 * s) / 24, u))));
    mesh.push("M" + row.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("L"), "M" + col.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("L"));
  }
  const base = pts(proj, [toV(0, 0, 0), toV(2, 0, 0), toV(2, 2, 0), toV(0, 2, 0)]);
  const sheet = mode === "slices"
    ? pts(proj, [toV(xs, 0, 0), ...Array.from({ length: 41 }, (_, s) => toV(xs, (2 * s) / 40, fn.f(xs, (2 * s) / 40))), toV(xs, 2, 0)])
    : [];
  // the part of the floor already swept by the slices
  const swept = mode === "slices" && xs > 0 ? pts(proj, [toV(0, 0, 0), toV(xs, 0, 0), toV(xs, 2, 0), toV(0, 2, 0)]) : [];
  const ax = (a: V3, b: V3, label: string) => { const p = proj(a), q = proj(b); return <g key={label}><line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={C.axis} strokeWidth={1.2} /><text x={q.x + 4} y={q.y + 4} fontSize={10} fill={C.muted} fontFamily="monospace">{label}</text></g>; };

  return (
    <div className="relative">
      <svg ref={orb.ref} {...orb.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-grab" style={{ touchAction: "none" }}>
        <path d={d(base)} fill={C.muted} fillOpacity={0.08} stroke={C.axis} strokeWidth={1} />
        {swept.length > 0 && <path d={d(swept)} fill={C.amber} fillOpacity={0.12} stroke="none" />}
        {ax(toV(0, 0, 0), toV(2.5, 0, 0), "x")}
        {ax(toV(0, 0, 0), toV(0, 2.5, 0), "y")}
        {ax(toV(0, 0, 0), toV(0, 0, 4.6), "z")}
        {boxes.map((b, i) => <path key={i} d={d(b.sp)} fill={b.fill} stroke="hsl(200, 70%, 24%)" strokeWidth={0.6} strokeLinejoin="round" />)}
        {mesh.map((m, i) => <path key={i} d={m} fill="none" stroke={C.fg} strokeWidth={0.7} opacity={mode === "boxes" ? 0.35 : 0.5} />)}
        {mode === "slices" && <path d={d(sheet)} fill={C.amber} fillOpacity={0.45} stroke={C.amber} strokeWidth={1.6} strokeLinejoin="round" />}
      </svg>
      <div className="absolute top-2 right-2"><Btn onClick={orb.reset}>{tx(t, "figDbl_view", "reset view")}</Btn></div>
    </div>
  );
}

export function DoubleIntegralFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("boxes");
  const [key, setKey] = useState<Key>("dome");
  const [n, setN] = useState(2);
  const [xs, setXs] = useState(0.75);
  const [playing, setPlaying] = useState(false);
  const acc = useRef(0);                               // time since the last automatic doubling
  const lab = useLab("math-double");
  const vis = useVisible<HTMLDivElement>();
  useFrame(playing && (vis.on || lab.open), dt => {
    if (mode === "boxes") {
      if (n >= N_MAX) { setPlaying(false); return; }
      acc.current += dt;
      if (acc.current > 0.9) { acc.current = 0; setN(Math.min(N_MAX, n * 2)); }
    } else {
      if (xs >= 2) setPlaying(false);
      else setXs(Math.min(2, xs + dt * 0.4));
    }
  });

  const stop = () => setPlaying(false);
  const pick = (m: Mode) => { setMode(m); stop(); };
  const nTo = (v: number) => { stop(); setN(Math.max(1, Math.min(N_MAX, v))); };
  const xTo = (v: number) => { stop(); setXs(Math.max(0, Math.min(2, +v.toFixed(2)))); };

  const fn = FNS[key];
  const exact = useMemo(() => midSum(fn.f, 300), [fn]);
  const sum = midSum(fn.f, n), A = sliceArea(fn.f, xs), soFar = volumeTo(fn.f, xs);
  const err = sum - exact;

  const view = (
    <div>
      <DblStage mode={mode} k={key} n={n} xs={xs} t={t} />
      {mode === "boxes" ? (
        <Transport t={t} playing={playing}
          onPlay={() => { if (n >= N_MAX) setN(1); acc.current = 0; setPlaying(p => !p); }}
          playLabel={tx(t, "figDbl_double", "keep doubling n")}
          onStep={() => nTo(n * 2)}
          onBack={() => nTo(n / 2)}
          onReset={() => nTo(1)}
          readout={`${n}×${n} = ${n * n}`} />
      ) : (
        <Transport t={t} playing={playing}
          onPlay={() => { if (xs >= 2) setXs(0); setPlaying(p => !p); }}
          playLabel={tx(t, "figDbl_sweep", "sweep the slice across")}
          onStep={() => xTo((Math.floor(xs / X_STEP + 0.02) + 1) * X_STEP)}
          onBack={() => xTo((Math.ceil(xs / X_STEP - 0.02) - 1) * X_STEP)}
          onReset={() => xTo(0)}
          readout={`x = ${f2(xs, 2)}`} />
      )}
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={pick} options={[["boxes", tx(t, "figDbl_boxes", "boxes")], ["slices", tx(t, "figDbl_slices", "slices")]] as const} />;
  const controls = <>
    <Row>{(Object.keys(FNS) as Key[]).map(k => <Btn key={k} active={key === k} onClick={() => { setKey(k); stop(); }}>{FNS[k].label}</Btn>)}</Row>
    <Row>
      {mode === "boxes"
        ? <Readout color={C.sky}>{`${tx(t, "figDbl_sum", "boxes")} = ${f2(sum, 4)}`}</Readout>
        : <>
          <Readout color={C.amber}>{`A(x) = ∫₀² f(x, y) dy = ${f2(A, 4)}`}</Readout>
          <Readout color={C.sky}>{`${tx(t, "figDbl_soFar", "volume so far")} ∫₀ˣ A = ${f2(soFar, 4)}`}</Readout>
        </>}
      <Readout color={C.green}>{`${tx(t, "figDbl_exact", "volume")} = ${fn.exact ? fn.exact + " = " : "≈ "}${f2(exact, 4)}`}</Readout>
    </Row>
  </>;
  const note = <>
    {mode === "boxes"
      ? tx(t, "figDbl_noteBoxes2", "Each small square of the floor has area ΔA = Δx · Δy and carries a box as tall as the surface above its centre, so its volume is f · ΔA. Add all the boxes: a double Riemann sum. Press ⏭ to double n: the boxes fit the surface ever more closely, and the sum approaches the volume, the double integral.")
      : tx(t, "figDbl_noteSlices2", "Freeze x and the surface above the line x = constant is an ordinary curve in y; the area under it, A(x), is a one-variable integral. Press play to sweep the slice across: the sheet's area changes, and the volume swept so far adds up as ∫ A(x) dx. At x = 2 it is the whole volume: two ordinary integrals, one inside the other.")}{" "}
    <span data-mouse-only>{tx(t, "figDbl_drag", "Drag to turn the view.")}</span>
    <span data-touch-only>{tx(t, "figDbl_dragTouch", "Swipe to turn the view.")}</span>
  </>;

  // ── Lab ──
  const boxes = mode === "boxes", slices = mode === "slices";
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figDblL1_t", "Boxes under a dome"),
      body: <>
        <p>{tx(t, "figDblL1_b1", "Each box stands on a small square of the floor and is as tall as the dome above its centre. Their total volume is a double Riemann sum.")}</p>
        <p>{tx(t, "figDblL1_b2", "Double the number of boxes until the sum is within 0.05 of the true volume 32/3.")}</p>
      </>,
      goal: { text: fill(tx(t, "figDblL1_g", "|boxes − 32/3| < 0.05 (now {e})."), { e: f2(Math.abs(err), 3) }), done: boxes && key === "dome" && Math.abs(err) < 0.05 },
      hint: tx(t, "figDblL1_h", "Each ⏭ doubles n; 8 × 8 boxes are enough."),
      focus: "step",
      setup: () => { pick("boxes"); setKey("dome"); setN(1); },
    },
    {
      title: tx(t, "figDblL2_t", "Quick check"),
      body: <p>{tx(t, "figDblL2_b", "f = 1 + xy/2 on [0, 2] × [0, 2]. The inner integral treats x as a constant.")}</p>,
      quiz: {
        q: tx(t, "figDblL2_q", "What is ∫₀² (1 + xy/2) dy?"),
        options: ["2 + x", "1 + x", "2 + 2x", "2"],
        answer: 0,
        why: tx(t, "figDblL2_w", "[y + xy²/4]₀² = 2 + 4x/4 = 2 + x. Then ∫₀² (2 + x) dx = 4 + 2 = 6, the plane's volume."),
      },
    },
    {
      title: tx(t, "figDblL3_t", "The biggest slice"),
      body: <>
        <p>{tx(t, "figDblL3_b1", "Each slice at fixed x has area A(x) = ∫₀² f(x, y) dy. For the bump they are not all equal.")}</p>
        <p>{tx(t, "figDblL3_b2", "Move the slice to where its area is largest.")}</p>
      </>,
      goal: { text: fill(tx(t, "figDblL3_g", "The largest A(x) (now {a})."), { a: f2(A, 3) }), done: slices && key === "bump" && Math.abs(xs - 1) < 0.03 },
      hint: tx(t, "figDblL3_h", "The bump is centred at (1, 1): x = 1."),
      setup: () => { pick("slices"); setKey("bump"); setXs(0); },
    },
    {
      title: tx(t, "figDblL4_t", "Slices add up"),
      body: <>
        <p>{tx(t, "figDblL4_b1", "Each slice of thickness dx adds A(x) dx to the volume. Sweep the slice all the way across.")}</p>
      </>,
      goal: { text: tx(t, "figDblL4_g", "x = 2: the slices add up to the whole volume."), done: slices && xs >= 2 - 1e-9 },
      focus: "play",
    },
    {
      title: tx(t, "figDblL5_t", "Quick check"),
      body: <p>{tx(t, "figDblL5_b", "On a rectangle, a product of a function of x and a function of y splits into two single integrals.")}</p>,
      quiz: {
        q: tx(t, "figDblL5_q", "What is ∬ x²y dA over [0, 3] × [0, 2]?"),
        options: ["18", "9", "12", "54"],
        answer: 0,
        why: tx(t, "figDblL5_w", "(∫₀³ x² dx)(∫₀² y dy) = 9 · 2 = 18."),
      },
    },
    {
      title: tx(t, "figDblL6_t", "Quick check"),
      body: <p>{tx(t, "figDblL6_b", "In polar coordinates a small patch has area r dr dθ.")}</p>,
      quiz: {
        q: tx(t, "figDblL6_q", "What is ∫₀^(2π) ∫₀² r dr dθ?"),
        options: ["4π", "2π", "8π", "4"],
        answer: 0,
        why: tx(t, "figDblL6_w", "Inner: [r²/2]₀² = 2. Outer: 2 · 2π = 4π, the area π · 2² of a disc of radius 2. Without the factor r the answer would match here only by chance: for radius 3 it would give 6π instead of 9π."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "one", tone: "info", when: boxes && n === 1,
      title: tx(t, "figDblI1_t", "One box"),
      body: fill(tx(t, "figDblI1_b", "A single 2 × 2 box as tall as f at the centre (1, 1): volume 4 · f(1, 1) = {v}. A first, rough guess."), { v: f2(sum, 3) }),
    },
    {
      id: "close", tone: "ok", when: boxes && n > 1 && Math.abs(err) < 0.01 * exact,
      title: tx(t, "figDblI2_t", "Within 1 %"),
      body: fill(tx(t, "figDblI2_b", "{n} × {n} boxes give {s}, against the volume {v}. The limit of these sums is the double integral."), { n, s: f2(sum, 4), v: f2(exact, 4) }),
    },
    {
      id: "line", tone: "info", when: slices && key === "plane",
      title: tx(t, "figDblI3_t", "Slices grow in a straight line"),
      body: fill(tx(t, "figDblI3_b", "For the plane, A(x) = 2 + x: here {a}. The outer integral ∫₀² (2 + x) dx = 6 adds them up."), { a: f2(A, 3) }),
    },
    {
      id: "all", tone: "ok", when: slices && xs >= 2 - 1e-9,
      title: tx(t, "figDblI4_t", "The whole volume"),
      body: fill(tx(t, "figDblI4_b", "The slices from x = 0 to 2 add up to {v}: the iterated integral ∫₀² A(x) dx equals the volume the boxes approached."), { v: f2(soFar, 4) }),
    },
  ];

  const title = tx(t, "figDbl_title", "Volume under a surface");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        <div ref={vis.ref}>{view}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figDblR1", "The double integral is the limit of box sums f · ΔA: the volume under the surface."),
          tx(t, "figDblR2", "Freeze x and the inner integral gives the slice area A(x); the outer integral adds the slices."),
          tx(t, "figDblR3", "On a rectangle the order of the two integrals does not matter."),
        ]}
      />
    </>
  );
}
