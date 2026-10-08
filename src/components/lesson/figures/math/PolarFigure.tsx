"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, Btn, C, T, Handle, plot, useDrag, useFrame, useVisible, nearest } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// curves — polar curves r = f(θ) on a polar grid (rings of equal r, spokes of
//          equal θ). The Transport sweeps θ and a point sits at distance f(θ)
//          along it: circle, cardioid, rose and spiral.
// turn   — a heading and a target direction on a dial. The raw difference
//          target − heading can be almost a full turn; wrapped into (−π, π]
//          it is the short way round, which is the turn to make.
// The lab: draw a rose, find a negative r, grow a spiral, then the short turn.

type Mode = "curves" | "turn";
type Curve = "circle" | "cardioid" | "rose" | "spiral";
const W = 560, H = 300;
const TAU = Math.PI * 2;
const SWEEP_STEP = TAU / 12;        // one Transport step: 30° of the sweep
const R0 = 2.4;                     // radius of the heading and target handles
const p = plot({ W, H, x0: -5.6, x1: 5.6, y0: -3, y1: 3 });
const n2 = (v: number) => (Math.abs(v) < 5e-3 ? 0 : v).toFixed(2).replace("-", "−");
const deg = (a: number) => `${(Math.round((a * 180) / Math.PI * 10) / 10).toString().replace("-", "−")}°`;
const wrap = (a: number) => { const w = ((a + Math.PI) % TAU + TAU) % TAU - Math.PI; return w === -Math.PI ? Math.PI : w; };
const curveFn = (curve: Curve, k: number) => (a: number) =>
  curve === "circle" ? 2.2 : curve === "cardioid" ? 1.3 * (1 + Math.cos(a)) : curve === "rose" ? 2.6 * Math.cos(k * a) : 0.2 * a;
/** The spiral is swept over two turns, the others over one. */
const spanOf = (curve: Curve) => (curve === "spiral" ? 2 * TAU : TAU);

// ── The drawings ──────────────────────────────────────────────────────────────

function PolarGrid() {
  return <g pointerEvents="none">
    {[0.5, 1, 1.5, 2, 2.5].map(r => <circle key={r} cx={p.X(0)} cy={p.Y(0)} r={r * p.sx} fill="none" stroke={C.grid} strokeWidth={r % 1 === 0 ? 1 : 0.6} />)}
    {Array.from({ length: 12 }, (_, i) => { const a = (i * TAU) / 12; return <line key={i} x1={p.X(0)} y1={p.Y(0)} x2={p.X(2.9 * Math.cos(a))} y2={p.Y(2.9 * Math.sin(a))} stroke={C.grid} strokeWidth={i % 3 === 0 ? 1.1 : 0.6} />; })}
    {[1, 2].map(r => <text key={r} x={p.X(r) + 2} y={p.Y(0) - 3} fontSize={8.5} fill={C.axis} fontFamily="monospace">{r}</text>)}
  </g>;
}

function CurvesDrawing({ curve, k, th }: { curve: Curve; k: number; th: number }) {
  const f = curveFn(curve, k), span = spanOf(curve);
  const a = th * (span / TAU), r = f(a);
  const pts = Array.from({ length: 601 }, (_, i) => { const b = (i / 600) * span, rr = f(b); return `${i ? "L" : "M"}${p.X(rr * Math.cos(b)).toFixed(1)},${p.Y(rr * Math.sin(b)).toFixed(1)}`; }).join("");
  const trace = Array.from({ length: 301 }, (_, i) => { const b = (i / 300) * a, rr = f(b); return `${i ? "L" : "M"}${p.X(rr * Math.cos(b)).toFixed(1)},${p.Y(rr * Math.sin(b)).toFixed(1)}`; }).join("");
  const P = { x: r * Math.cos(a), y: r * Math.sin(a) };
  const formula = curve === "circle" ? "r = 2.2" : curve === "cardioid" ? "r = 1.3(1 + cos θ)" : curve === "rose" ? `r = 2.6 cos(${k}θ)` : "r = 0.2 θ";
  return <>
    <PolarGrid />
    <path d={pts} fill="none" stroke={C.sky} strokeWidth={1.2} opacity={0.35} />
    <path d={trace} fill="none" stroke={C.sky} strokeWidth={2.4} />
    <line x1={p.X(0)} y1={p.Y(0)} x2={p.X(3 * Math.cos(a))} y2={p.Y(3 * Math.sin(a))} stroke={C.purple} strokeWidth={1} strokeDasharray="4 3" />
    <line x1={p.X(0)} y1={p.Y(0)} x2={p.X(P.x)} y2={p.Y(P.y)} stroke={r < 0 ? C.red : C.amber} strokeWidth={2.2} />
    <circle cx={p.X(P.x)} cy={p.Y(P.y)} r={5.5} fill={C.amber} />
    <T x={8} y={16} size={11} color={C.sky} bold>{formula}</T>
  </>;
}

function TurnDrawing({ head, targ, dragging, t }: { head: number; targ: number; dragging: "h" | "g" | null; t?: TrackTranslations }) {
  const raw = targ - head, w = wrap(raw);
  const arc = (r0: number, a0: number, d: number, col: string, wd: number, dash?: string) => {
    const path = Array.from({ length: 61 }, (_, i) => { const b = a0 + (d * i) / 60; return `${i ? "L" : "M"}${p.X(r0 * Math.cos(b))},${p.Y(r0 * Math.sin(b))}`; }).join("");
    return <path d={path} fill="none" stroke={col} strokeWidth={wd} strokeDasharray={dash} />;
  };
  return <>
    <PolarGrid />
    {arc(1.2, head, raw, C.red, 1.5, "4 3")}
    {arc(1.6, head, w, C.green, 3.5)}
    <line x1={p.X(0)} y1={p.Y(0)} x2={p.X(R0 * Math.cos(head))} y2={p.Y(R0 * Math.sin(head))} stroke={C.sky} strokeWidth={3} />
    <line x1={p.X(0)} y1={p.Y(0)} x2={p.X(R0 * Math.cos(targ))} y2={p.Y(R0 * Math.sin(targ))} stroke={C.amber} strokeWidth={2} strokeDasharray="5 3" />
    <Handle x={p.X(R0 * Math.cos(head))} y={p.Y(R0 * Math.sin(head))} color={C.sky} active={dragging === "h"} />
    <Handle x={p.X(R0 * Math.cos(targ))} y={p.Y(R0 * Math.sin(targ))} color={C.amber} active={dragging === "g"} />
    <T x={p.X(2.75 * Math.cos(head))} y={p.Y(2.75 * Math.sin(head)) + 4} size={10} anchor="middle" color={C.sky} bold>{tx(t, "figPol_heading", "heading")}</T>
    <T x={p.X(2.75 * Math.cos(targ))} y={p.Y(2.75 * Math.sin(targ)) + 4} size={10} anchor="middle" color={C.amber} bold>{tx(t, "figPol_target", "target")}</T>
  </>;
}

/** The svg of the current mode; owns the drag (it is mounted twice while the lab is open). */
function PolStage({ mode, curve, k, th, head, targ, setHead, setTarg, t }: {
  mode: Mode; curve: Curve; k: number; th: number; head: number; targ: number;
  setHead: (v: number) => void; setTarg: (v: number) => void; t?: TrackTranslations;
}) {
  const drag = useDrag<"h" | "g">(
    q => mode === "turn" ? nearest(q, [["h", { x: p.X(R0 * Math.cos(head)), y: p.Y(R0 * Math.sin(head)) }], ["g", { x: p.X(R0 * Math.cos(targ)), y: p.Y(R0 * Math.sin(targ)) }]], 22) : null,
    (id, q) => {
      const w = p.inv(q), a = Math.round(Math.atan2(w.y, w.x) * 180 / Math.PI) * Math.PI / 180;
      (id === "h" ? setHead : setTarg)(a);
    });
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {mode === "curves" ? <CurvesDrawing curve={curve} k={k} th={th} /> : <TurnDrawing head={head} targ={targ} dragging={drag.dragging} t={t} />}
    </svg>
  );
}

export function PolarFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("curves");
  const [curve, setCurve] = useState<Curve>("rose");
  const [k, setK] = useState(3);
  const [th, setTh] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [head, setHead] = useState(2.6), [targ, setTarg] = useState(-2.4);
  const lab = useLab("math-polar");
  const vis = useVisible<HTMLDivElement>();
  useFrame(playing && mode === "curves" && (vis.on || lab.open), dt => {
    const next = Math.min(TAU, th + dt * 0.7);
    setTh(next);
    if (next >= TAU) setPlaying(false);
  });

  const pick = (m: Mode) => { setMode(m); setPlaying(false); };
  const sweepTo = (v: number) => { setPlaying(false); setTh(Math.max(0, Math.min(TAU, v))); };
  const span = spanOf(curve), a = th * (span / TAU), r = curveFn(curve, k)(a);
  const raw = targ - head, w = wrap(raw);
  const done = th >= TAU - 1e-6;

  const view = (
    <div>
      <PolStage mode={mode} curve={curve} k={k} th={th} head={head} targ={targ} setHead={setHead} setTarg={setTarg} t={t} />
      {mode === "curves" && (
        <Transport t={t} playing={playing}
          onPlay={() => { if (playing) { setPlaying(false); return; } if (done) setTh(0); setPlaying(true); }}
          playLabel={tx(t, "figPol_play", "sweep θ")}
          onStep={!done ? () => sweepTo((Math.floor(th / SWEEP_STEP + 1e-6) + 1) * SWEEP_STEP) : undefined}
          onBack={th > 0 ? () => sweepTo((Math.ceil(th / SWEEP_STEP - 1e-6) - 1) * SWEEP_STEP) : undefined}
          onReset={() => sweepTo(0)}
          readout={`θ = ${deg(a)}`} />
      )}
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["curves", tx(t, "figPol_mCurves", "polar curves")],
    ["turn", tx(t, "figPol_mTurn", "shortest turn")],
  ] as const} />;
  const P = { x: r * Math.cos(a), y: r * Math.sin(a) };
  const controls = mode === "curves" ? <>
    <Row>
      {([["circle", tx(t, "figPol_circle", "circle")], ["cardioid", tx(t, "figPol_cardioid", "cardioid")], ["rose", tx(t, "figPol_rose", "rose")], ["spiral", tx(t, "figPol_spiral", "spiral")]] as const).map(([c, l]) =>
        <Btn key={c} active={curve === c} onClick={() => setCurve(c)}>{l}</Btn>)}
    </Row>
    <Sliders>
      <Slider label="θ" value={th} min={0} max={TAU} step={0.01} onChange={sweepTo} fmt={v => deg(v * (span / TAU))} />
      {curve === "rose" && <Slider label="k" value={k} min={1} max={7} step={1} onChange={setK} fmt={String} />}
    </Sliders>
    <Row>
      <Readout color={C.amber}>{`r = ${n2(r)}`}</Readout>
      <Readout>{`(x, y) = (r cos θ, r sin θ) = (${n2(P.x)}, ${n2(P.y)})`}</Readout>
      {r < 0 && <Readout color={C.red}>{tx(t, "figPol_neg", "r < 0: plotted on the opposite side")}</Readout>}
    </Row>
  </> : <Row>
    <Readout color={C.sky}>{`${tx(t, "figPol_heading", "heading")} = ${deg(head)}`}</Readout>
    <Readout color={C.amber}>{`${tx(t, "figPol_target", "target")} = ${deg(targ)}`}</Readout>
    <Readout color={C.red}>{`${tx(t, "figPol_raw", "raw difference")} = ${deg(raw)}`}</Readout>
    <Readout color={C.green}>{`${tx(t, "figPol_wrapped", "wrapped")} = ${deg(w)} ${w >= 0 ? "↺" : "↻"}`}</Readout>
  </Row>;
  const note = mode === "curves"
    ? tx(t, "figPol_noteC2", "On a polar grid the rings are distances from the centre and the spokes are angles. A polar curve gives the distance r for each angle θ. Press play to sweep θ and watch the amber point: the circle keeps r fixed, the spiral lets r grow steadily with θ, the cardioid swells and shrinks once per turn, and the rose r = cos(kθ) makes petals (k petals for odd k, 2k for even k). When r comes out negative the point is drawn on the opposite side of the centre, which is how the rose gets its extra petals.")
    : tx(t, "figPol_noteT", "Drag the heading (blue) and the target (amber). atan2 returns angles between −180° and 180°, so simply subtracting them can give almost a full turn (red dashed arc) even when the target is just past the ±180° line. Wrapping the difference back into (−180°, 180°] gives the short way round (green): its sign says which way to turn, anticlockwise or clockwise, and its size how far.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figPolL1_t", "Draw a rose"),
      body: <>
        <p>{tx(t, "figPolL1_b1", "r = 2.6 cos(3θ): for each direction θ the curve sits at distance r. Rings are distances, spokes are angles.")}</p>
        <p>{tx(t, "figPolL1_b2", "Press play and let θ sweep a full turn.")}</p>
      </>,
      goal: { text: tx(t, "figPolL1_g", "θ reaches 360°."), done: mode === "curves" && curve === "rose" && done },
      focus: "play",
      setup: () => { pick("curves"); setCurve("rose"); setK(3); setTh(0); },
    },
    {
      title: tx(t, "figPolL2_t", "Negative distance"),
      body: <p>{tx(t, "figPolL2_b", "cos(3θ) is negative for some angles, so r < 0. Step back to such an angle: the radius turns red and the point is drawn on the opposite side.")}</p>,
      goal: { text: tx(t, "figPolL2_g", "r < 0."), done: mode === "curves" && curve === "rose" && r < -0.05 },
      hint: tx(t, "figPolL2_h", "Try θ = 60°: 3θ = 180° and cos 180° = −1."),
      focus: "back",
    },
    {
      title: tx(t, "figPolL3_t", "Quick check"),
      body: <p>{tx(t, "figPolL3_b", "Change k and count the petals: k petals when k is odd, 2k when it is even.")}</p>,
      quiz: {
        q: tx(t, "figPolL3_q", "How many petals does r = cos(4θ) have?"),
        options: ["8", "4", "2", "16"],
        answer: 0,
        why: tx(t, "figPolL3_w", "k = 4 is even, so the negative stretches draw new petals instead of retracing old ones: 2k = 8."),
      },
    },
    {
      title: tx(t, "figPolL4_t", "A spiral"),
      body: <p>{tx(t, "figPolL4_b", "r = 0.2 θ grows by the same amount every turn, like a coiled rope. Choose the spiral and sweep until the point is 2 from the centre.")}</p>,
      goal: { text: tx(t, "figPolL4_g", "Spiral with r ≥ 2."), done: mode === "curves" && curve === "spiral" && r >= 2 },
      hint: tx(t, "figPolL4_h", "r = 2 needs θ = 10 rad, about 573°: well into the second turn."),
      setup: () => { pick("curves"); setTh(0); },
    },
    {
      title: tx(t, "figPolL5_t", "The short way round"),
      body: <>
        <p>{tx(t, "figPolL5_b1", "Heading and target are both atan2 angles, between −180° and 180°. Their raw difference can be almost a whole turn.")}</p>
        <p>{tx(t, "figPolL5_b2", "Drag them so that the raw difference is beyond ±180° but the wrapped turn is less than 45°.")}</p>
      </>,
      goal: { text: tx(t, "figPolL5_g", "|raw| > 180° and |wrapped| < 45°."), done: mode === "turn" && Math.abs(raw) > Math.PI && Math.abs(w) < Math.PI / 4 },
      hint: tx(t, "figPolL5_h", "Put one just above the negative x-axis and the other just below it."),
      setup: () => { pick("turn"); setHead(2.6); setTarg(-2.4); },
    },
    {
      title: tx(t, "figPolL6_t", "Quick check"),
      body: <p>{tx(t, "figPolL6_b", "Wrap: add or subtract 360° until the difference lies in (−180°, 180°].")}</p>,
      quiz: {
        q: tx(t, "figPolL6_q", "A ship heads at 170° and must face −150°. Which turn?"),
        options: [tx(t, "figPolL6_o1", "40° anticlockwise"), tx(t, "figPolL6_o2", "320° clockwise"), tx(t, "figPolL6_o3", "20° clockwise"), tx(t, "figPolL6_o4", "160° anticlockwise")],
        answer: 0,
        why: tx(t, "figPolL6_w", "Raw: −150° − 170° = −320°. Add 360°: +40°, positive, so anticlockwise, through the 180° line."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "neg", tone: "info", when: mode === "curves" && r < -0.05,
      title: tx(t, "figPolI1_t", "r is negative"),
      body: fill(tx(t, "figPolI1_b", "r = {r}: walking a negative distance along the direction θ means walking forwards along θ + 180°. That is why the point is on the opposite side of the spoke."), { r: n2(r) }),
    },
    {
      id: "pole", tone: "ok", when: mode === "curves" && curve === "cardioid" && Math.abs(r) < 0.05,
      title: tx(t, "figPolI2_t", "Through the pole"),
      body: tx(t, "figPolI2_b", "At θ = 180° the cardioid's 1 + cos θ is 0: the curve touches the centre and makes its dent."),
    },
    {
      id: "long", tone: "warn", when: mode === "turn" && Math.abs(raw) > Math.PI,
      title: tx(t, "figPolI3_t", "The long way round"),
      body: fill(tx(t, "figPolI3_b", "The raw difference {raw} is more than half a turn. Turning by it goes the long way; the wrapped {w} reaches the same direction faster."), { raw: deg(raw), w: deg(w) }),
    },
  ];

  const title = tx(t, "figPol_title", "Polar coordinates");
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
          tx(t, "figPolR1", "A polar curve gives the distance r for each direction θ; the point is (r cos θ, r sin θ)."),
          tx(t, "figPolR2", "A negative r is drawn on the opposite side; it gives even roses their extra petals."),
          tx(t, "figPolR3", "Wrap an angle difference into (−180°, 180°] to get the shortest turn and its direction."),
        ]}
      />
    </>
  );
}
