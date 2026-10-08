"use client";

import { useEffect, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, Handle, plot, Grid, useDrag, useVisible, nearest, clamp } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { scaledMs, useFigureSpeed } from "@/components/lesson/kit/Stepper";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// ratios  — a right triangle with angle θ (drag its top corner). Change its
//           size: every side changes but the three ratios (sin, cos, tan) do
//           not, because all right triangles with the same θ are similar.
//           Change θ: the ratios change.
// special — the two triangles whose ratios are exact. The Transport cuts a
//           square and an equilateral triangle in half, then finds the missing
//           side of each half with Pythagoras.
// height  — measuring a height from the ground: distance d and the angle up to
//           the top θ give h = d · tan θ.
// The lab: same angle at any size, find 30° and 45° from their ratios, build
// the exact triangles, then measure a tower.

type Mode = "ratios" | "special" | "height";
const W = 560, H = 300;
const DEG = Math.PI / 180;
const STAGES = 2;
const n2 = (v: number) => (+v.toFixed(2)).toString();
const n3 = (v: number) => v.toFixed(3);
const pr = plot({ W, H, x0: -0.8, x1: 8.533, y0: -0.7, y1: 4.3 });
const psp = plot({ W, H, x0: -0.5, x1: 8.833, y0: -0.8, y1: 4.2 });
const ph = plot({ W, H, x0: -1, x1: 9.333, y0: -0.8, y1: 4.733 });
const fade = (on: boolean) => ({ opacity: on ? 1 : 0, transition: "opacity 0.5s ease" });

/** The hypotenuse actually drawn: the requested size, shrunk to fit the frame. */
const drawnHyp = (th: number, size: number) => Math.min(size, 4.1 / Math.sin(th * DEG), 7.9 / Math.cos(th * DEG));

// ── The drawings ──────────────────────────────────────────────────────────────

function RatiosDrawing({ th, size, active, t }: { th: number; size: number; active: boolean; t?: TrackTranslations }) {
  const p = pr;
  const s = Math.sin(th * DEG), c = Math.cos(th * DEG);
  const hyp = drawnHyp(th, size);
  const A = { x: 0, y: 0 }, B = { x: hyp * c, y: 0 }, Cc = { x: hyp * c, y: hyp * s };
  const P = (q: { x: number; y: number }) => `${p.X(q.x)},${p.Y(q.y)}`;
  const arc = 0.7;
  return <>
    <Grid p={p} step={1} labels={false} />
    <polygon points={[A, B, Cc].map(P).join(" ")} fill={C.sky} fillOpacity={0.12} stroke={C.fg} strokeWidth={2} strokeLinejoin="round" />
    <polygon points={[A, { x: c, y: 0 }, { x: c, y: s }].map(P).join(" ")} fill={C.purple} fillOpacity={0.25} stroke={C.purple} strokeWidth={1.2} strokeDasharray="3 2" />
    <line x1={p.X(A.x)} y1={p.Y(0)} x2={p.X(B.x)} y2={p.Y(0)} stroke={C.red} strokeWidth={3} />
    <line x1={p.X(B.x)} y1={p.Y(0)} x2={p.X(Cc.x)} y2={p.Y(Cc.y)} stroke={C.green} strokeWidth={3} />
    <line x1={p.X(A.x)} y1={p.Y(0)} x2={p.X(Cc.x)} y2={p.Y(Cc.y)} stroke={C.amber} strokeWidth={3} />
    <path d={`M${p.X(B.x) - 10},${p.Y(0)} v-10 h10`} fill="none" stroke={C.fg} strokeWidth={1.1} />
    <path d={`M${p.X(arc)},${p.Y(0)} A${arc * p.sx},${arc * p.sy} 0 0 0 ${p.X(arc * c)},${p.Y(arc * s)}`} fill="none" stroke={C.fg} strokeWidth={1.3} />
    <T x={p.X(arc + 0.15)} y={p.Y(0.18)} size={10} color={C.fg} bold>{`θ = ${th}°`}</T>
    <T x={p.X(B.x / 2)} y={p.Y(0) + 15} size={10} anchor="middle" color={C.red} bold>{`${tx(t, "figRt_adj", "adj")} ${n2(B.x)}`}</T>
    <T x={p.X(B.x) + 6} y={p.Y(Cc.y / 2)} size={10} color={C.green} bold>{`${tx(t, "figRt_opp", "opp")} ${n2(Cc.y)}`}</T>
    <T x={p.X(Cc.x / 2) - 8} y={p.Y(Cc.y / 2) - 6} size={10} anchor="end" color={C.amber} bold>{`${tx(t, "figRt_hyp", "hyp")} ${n2(hyp)}`}</T>
    <Handle x={p.X(Cc.x)} y={p.Y(Cc.y)} color={C.amber} active={active} />
  </>;
}

function SpecialDrawing({ stage }: { stage: number }) {
  const p = psp;
  const k = 3, ox = 4.6, u = 1.75, hgt = Math.sqrt(3) * u;
  const Q = (x: number, y: number) => `${p.X(x)},${p.Y(y)}`;
  const cut = stage >= 1, solved = stage >= 2;
  return <>
    {/* a unit square, cut along its diagonal */}
    <polygon points={[Q(0, 0), Q(k, 0), Q(k, k), Q(0, k)].join(" ")} fill={C.sky} fillOpacity={cut ? 0 : 0.14}
      stroke={cut ? C.muted : C.sky} strokeWidth={cut ? 1 : 2} strokeDasharray={cut ? "4 3" : undefined} style={{ transition: "all 0.5s ease" }} />
    <g style={fade(cut)}>
      <polygon points={[Q(0, 0), Q(k, 0), Q(k, k)].join(" ")} fill={C.sky} fillOpacity={0.22} stroke={C.sky} strokeWidth={2} strokeLinejoin="round" />
      <path d={`M${p.X(k) - 10},${p.Y(0)} v-10 h10`} fill="none" stroke={C.fg} strokeWidth={1.1} />
      <T x={p.X(0.45)} y={p.Y(0.15)} size={10} color={C.fg}>45°</T>
      <T x={p.X(k) - 26} y={p.Y(k - 0.55)} size={10} color={C.fg}>45°</T>
    </g>
    <T x={p.X(k / 2)} y={p.Y(0) + 15} size={10.5} anchor="middle" color={C.fg} bold>1</T>
    <T x={p.X(k) + 6} y={p.Y(k / 2)} size={10.5} color={C.fg} bold>1</T>
    <g style={fade(solved)}>
      <T x={p.X(k / 2) - 10} y={p.Y(k / 2) - 4} size={10.5} anchor="end" color={C.amber} bold>√2</T>
      <T x={p.X(k / 2)} y={p.Y(0) + 31} size={9.5} anchor="middle" color={C.amber}>1² + 1² = 2</T>
    </g>

    {/* an equilateral triangle with side 2, cut down the middle */}
    <polygon points={[Q(ox, 0), Q(ox + 2 * u, 0), Q(ox + u, hgt)].join(" ")} fill={C.pink} fillOpacity={cut ? 0 : 0.14}
      stroke={cut ? C.muted : C.pink} strokeWidth={cut ? 1 : 2} strokeDasharray={cut ? "4 3" : undefined} style={{ transition: "all 0.5s ease" }} />
    <g style={fade(!cut)}>
      <T x={p.X(ox + u)} y={p.Y(0) + 15} size={10.5} anchor="middle" color={C.fg} bold>2</T>
      <T x={p.X(ox + 1.5 * u) + 8} y={p.Y(hgt / 2)} size={10.5} color={C.fg} bold>2</T>
      <T x={p.X(ox + u)} y={p.Y(hgt / 3) + 4} size={10} anchor="middle" color={C.fg}>60° · 60° · 60°</T>
    </g>
    <g style={fade(cut)}>
      <polygon points={[Q(ox, 0), Q(ox + u, 0), Q(ox + u, hgt)].join(" ")} fill={C.pink} fillOpacity={0.22} stroke={C.pink} strokeWidth={2} strokeLinejoin="round" />
      <path d={`M${p.X(ox + u) - 10},${p.Y(0)} v-10 h10`} fill="none" stroke={C.fg} strokeWidth={1.1} />
      <T x={p.X(ox + u / 2)} y={p.Y(0) + 15} size={10.5} anchor="middle" color={C.fg} bold>1</T>
      <T x={p.X(ox + 0.35)} y={p.Y(0.15)} size={10} color={C.fg}>60°</T>
      <T x={p.X(ox + u) - 22} y={p.Y(hgt - 0.75)} size={10} color={C.fg}>30°</T>
    </g>
    <T x={p.X(ox + u / 2) - 8} y={p.Y(hgt / 2)} size={10.5} anchor="end" color={cut ? C.amber : C.fg} bold>2</T>
    <g style={fade(solved)}>
      <T x={p.X(ox + u) + 6} y={p.Y(hgt / 2)} size={10.5} color={C.amber} bold>√3</T>
      <T x={p.X(ox + u)} y={p.Y(0) + 31} size={9.5} anchor="middle" color={C.amber}>2² − 1² = 3</T>
    </g>
  </>;
}

function HeightDrawing({ d, el, t }: { d: number; el: number; t?: TrackTranslations }) {
  const p = ph;
  const h = d * Math.tan(el * DEG), hs = Math.min(h, 4.6);
  return <>
    <line x1={0} y1={p.Y(0)} x2={W} y2={p.Y(0)} stroke={C.axis} strokeWidth={1.4} />
    <line x1={p.X(0)} y1={p.Y(0)} x2={p.X(d)} y2={p.Y(hs)} stroke={C.amber} strokeWidth={2} strokeDasharray="5 3" />
    <line x1={p.X(d)} y1={p.Y(0)} x2={p.X(d)} y2={p.Y(hs)} stroke={C.green} strokeWidth={5} strokeLinecap="round" />
    <circle cx={p.X(d)} cy={p.Y(hs)} r={9} fill={C.green} fillOpacity={0.5} />
    <line x1={p.X(0)} y1={p.Y(0) + 12} x2={p.X(d)} y2={p.Y(0) + 12} stroke={C.red} strokeWidth={1.5} />
    <T x={p.X(d / 2)} y={p.Y(0) + 26} size={10} anchor="middle" color={C.red} bold>{`d = ${n2(d)} m`}</T>
    <T x={p.X(d) + 12} y={p.Y(hs / 2)} size={10} color={C.green} bold>{`h = ${n2(h)} m`}</T>
    <path d={`M${p.X(1)},${p.Y(0)} A${p.sx},${p.sy} 0 0 0 ${p.X(Math.cos(el * DEG))},${p.Y(Math.sin(el * DEG))}`} fill="none" stroke={C.fg} strokeWidth={1.3} />
    <T x={p.X(1.1)} y={p.Y(0.2)} size={10} color={C.fg} bold>{`${el}°`}</T>
    <circle cx={p.X(0)} cy={p.Y(0)} r={5} fill={C.fg} />
    <T x={p.X(0)} y={p.Y(0) + 17} size={9.5} anchor="middle" color={C.fg}>{tx(t, "figRt_you", "you")}</T>
  </>;
}

/** The svg of the current mode; owns the drag (it is mounted twice while the lab is open). */
function RtStage({ mode, th, size, setTh, setSize, stage, d, el, t }: {
  mode: Mode; th: number; size: number; setTh: (v: number) => void; setSize: (v: number) => void;
  stage: number; d: number; el: number; t?: TrackTranslations;
}) {
  const drag = useDrag<"C">(
    q => {
      if (mode !== "ratios") return null;
      const hyp = drawnHyp(th, size);
      return nearest(q, [["C", { x: pr.X(hyp * Math.cos(th * DEG)), y: pr.Y(hyp * Math.sin(th * DEG)) }]], 22);
    },
    (_, q) => {
      const w = pr.inv(q);
      setTh(clamp(Math.round(Math.atan2(w.y, w.x) / DEG), 5, 85));
      setSize(clamp(Math.round(Math.hypot(w.x, w.y) * 10) / 10, 1.5, 8));
    });
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {mode === "ratios" ? <RatiosDrawing th={th} size={size} active={drag.dragging === "C"} t={t} />
        : mode === "special" ? <SpecialDrawing stage={stage} />
          : <HeightDrawing d={d} el={el} t={t} />}
    </svg>
  );
}

export function RightTriangleFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("ratios");
  const [th, setTh] = useState(35);
  const [size, setSize] = useState(5);
  const [d, setD] = useState(6);
  const [el, setEl] = useState(30);
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed] = useFigureSpeed();
  const lab = useLab("math-right-triangle");
  const vis = useVisible<HTMLDivElement>();

  useEffect(() => {
    if (!playing || !(vis.on || lab.open)) return;
    if (stage >= STAGES) { setPlaying(false); return; }
    const id = setTimeout(() => setStage(stage + 1), scaledMs(stage === 0 ? 400 : 1400, speed));
    return () => clearTimeout(id);
  }, [playing, stage, speed, vis.on, lab.open]);

  const pick = (v: Mode) => { setMode(v); setStage(0); setPlaying(false); };
  const s = Math.sin(th * DEG), c = Math.cos(th * DEG);
  const h = d * Math.tan(el * DEG);
  const opp = tx(t, "figRt_opp", "opp"), adj = tx(t, "figRt_adj", "adj"), hyp = tx(t, "figRt_hyp", "hyp");

  const stageNames = [
    tx(t, "figRt_s0", "a square and an equilateral triangle"),
    tx(t, "figRt_s1", "cut each in half"),
    tx(t, "figRt_s2", "Pythagoras gives the third side"),
  ];
  const view = (
    <div>
      <RtStage mode={mode} th={th} size={size} setTh={setTh} setSize={setSize} stage={stage} d={d} el={el} t={t} />
      {mode === "special" && (
        <Transport t={t} speed playing={playing}
          onPlay={() => { if (playing) { setPlaying(false); return; } if (stage >= STAGES) setStage(0); setPlaying(true); }}
          playLabel={tx(t, "figRt_play", "cut and measure")}
          onStep={stage < STAGES ? () => { setPlaying(false); setStage(stage + 1); } : undefined}
          onBack={stage > 0 ? () => { setPlaying(false); setStage(stage - 1); } : undefined}
          onReset={() => { setPlaying(false); setStage(0); }}
          readout={stageNames[stage]} />
      )}
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["ratios", tx(t, "figRt_mRatios", "ratios")],
    ["special", tx(t, "figRt_mSpecial", "special angles")],
    ["height", tx(t, "figRt_mHeight", "measure a height")],
  ] as const} />;
  const controls = mode === "ratios" ? <>
    <Sliders>
      <Slider label={tx(t, "figRt_angle", "angle θ")} value={th} min={5} max={85} step={1} onChange={setTh} fmt={v => `${v}°`} />
      <Slider label={tx(t, "figRt_size", "size")} value={size} min={1.5} max={8} step={0.1} onChange={setSize} fmt={n2} />
    </Sliders>
    <Row>
      <Readout color={C.green}>{`sin θ = ${opp}/${hyp} = ${n3(s)}`}</Readout>
      <Readout color={C.red}>{`cos θ = ${adj}/${hyp} = ${n3(c)}`}</Readout>
      <Readout color={C.sky}>{`tan θ = ${opp}/${adj} = ${n3(s / c)}`}</Readout>
    </Row>
  </> : mode === "special" ? <Row>
    <Readout color={C.sky}>{stage >= 2 ? `sin 45° = cos 45° = 1/√2 ≈ 0.707` : `45°: ?`}</Readout>
    <Readout color={C.pink}>{stage >= 1 ? `sin 30° = cos 60° = 1/2` : `30°: ?`}</Readout>
    <Readout color={C.pink}>{stage >= 2 ? `sin 60° = cos 30° = √3/2 ≈ 0.866` : `60°: ?`}</Readout>
  </Row> : <>
    <Sliders>
      <Slider label={tx(t, "figRt_dist", "distance d")} value={d} min={1} max={8} step={0.5} onChange={setD} fmt={v => `${n2(v)} m`} />
      <Slider label={tx(t, "figRt_elev", "angle up")} value={el} min={5} max={70} step={1} onChange={setEl} fmt={v => `${v}°`} />
    </Sliders>
    <Row>
      <Readout color={C.sky}>{`tan ${el}° = ${n3(Math.tan(el * DEG))}`}</Readout>
      <Readout color={C.green}>{`h = d · tan θ = ${n2(d)} · ${n3(Math.tan(el * DEG))} = ${n2(h)} m`}</Readout>
    </Row>
  </>;
  const note = mode === "ratios"
    ? tx(t, "figRt_noteR2", "Drag the amber corner or use the sliders. Change the size: all three sides grow or shrink together, but the three ratios in the readouts do not move, because every right triangle with the angle θ is similar to every other (AA). The small purple triangle is the one with hypotenuse 1: its sides are exactly cos θ and sin θ. Change θ and the ratios change. So each ratio is a function of the angle alone: that is what sine, cosine and tangent are.")
    : mode === "special"
      ? tx(t, "figRt_noteS2", "Two triangles give exact values. Press play. A square with side 1 is cut along its diagonal: two right triangles with 45° angles and legs 1, so the hypotenuse is √2 by Pythagoras. An equilateral triangle with side 2 is cut down the middle: its angles are 60°, the cut makes 30° at the top, the base half is 1, and the height is √(4 − 1) = √3. Then read any ratio off the pictures.")
      : tx(t, "figRt_noteH", "Stand a distance d from a tower and measure the angle up to its top. The ground, the tower and your line of sight make a right triangle: d is the side adjacent to the angle and the height h is the side opposite it, so tan θ = h/d and h = d · tan θ. Surveyors measure mountains this way, and sailors the height of cliffs.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figRtL1_t", "Same angle, any size"),
      body: <>
        <p>{tx(t, "figRtL1_b1", "The readouts divide one side by another. Watch them while the triangle grows.")}</p>
        <p>{tx(t, "figRtL1_b2", "Keep θ at 35° and make the triangle at least three times bigger.")}</p>
      </>,
      goal: { text: tx(t, "figRtL1_g", "θ = 35° and size ≥ 6."), done: mode === "ratios" && th === 35 && size >= 6 },
      hint: tx(t, "figRtL1_h", "Use the size slider: dragging the corner can move the angle too."),
      setup: () => { pick("ratios"); setTh(35); setSize(2); },
    },
    {
      title: tx(t, "figRtL2_t", "Quick check"),
      body: <p>{tx(t, "figRtL2_b", "sin 35° ≈ 0.574 and cos 35° ≈ 0.819, whatever the size.")}</p>,
      quiz: {
        q: tx(t, "figRtL2_q", "A right triangle has θ = 35° and hypotenuse 10. How long is the side opposite θ?"),
        options: ["5.74", "8.19", "7.00", "0.574"],
        answer: 0,
        why: tx(t, "figRtL2_w", "opp = hyp · sin θ = 10 · 0.574 = 5.74. 8.19 is the adjacent side, 10 · cos 35°."),
      },
    },
    {
      title: tx(t, "figRtL3_t", "Half the hypotenuse"),
      body: <p>{tx(t, "figRtL3_b", "Find the angle whose opposite side is exactly half the hypotenuse: sin θ = 0.5.")}</p>,
      goal: { text: tx(t, "figRtL3_g", "sin θ = 0.500."), done: mode === "ratios" && th === 30 },
      hint: tx(t, "figRtL3_h", "It is smaller than 45°, and a round number."),
      setup: () => { pick("ratios"); setTh(60); setSize(5); },
    },
    {
      title: tx(t, "figRtL4_t", "Opposite equals adjacent"),
      body: <p>{tx(t, "figRtL4_b", "Now make the two legs equal. The tangent divides one by the other, so it becomes 1.")}</p>,
      goal: { text: tx(t, "figRtL4_g", "tan θ = 1.000."), done: mode === "ratios" && th === 45 },
      hint: tx(t, "figRtL4_h", "Equal legs make an isosceles right triangle: both sharp angles are equal."),
    },
    {
      title: tx(t, "figRtL5_t", "The exact triangles"),
      body: <>
        <p>{tx(t, "figRtL5_b1", "Three angles have exact ratios, read off two simple shapes cut in half.")}</p>
        <p>{tx(t, "figRtL5_b2", "Step through the cut, then let Pythagoras find each missing side.")}</p>
      </>,
      goal: { text: tx(t, "figRtL5_g", "Reach the last stage."), done: mode === "special" && stage === STAGES },
      focus: "step",
      setup: () => pick("special"),
    },
    {
      title: tx(t, "figRtL6_t", "Quick check"),
      body: <p>{tx(t, "figRtL6_b", "Use the pink triangle: sides 1, √3 and 2.")}</p>,
      quiz: {
        q: tx(t, "figRtL6_q", "What is cos 30°?"),
        options: ["√3/2", "1/2", "√2/2", "√3"],
        answer: 0,
        why: tx(t, "figRtL6_w", "The side next to the 30° angle is the height √3, and the hypotenuse is 2: cos 30° = √3/2 ≈ 0.866. 1/2 is sin 30°."),
      },
    },
    {
      title: tx(t, "figRtL7_t", "Measure a tower"),
      body: <>
        <p>{tx(t, "figRtL7_b1", "You stand d from a tower and measure the angle up to its top. Then h = d · tan θ.")}</p>
        <p>{tx(t, "figRtL7_b2", "Set the distance and the angle so that the tower is 6 m tall.")}</p>
      </>,
      goal: { text: tx(t, "figRtL7_g", "h = 6 m (within 0.1 m)."), done: mode === "height" && Math.abs(h - 6) < 0.1 },
      hint: tx(t, "figRtL7_h", "At 45° the tangent is 1, so the height equals the distance."),
      setup: () => { pick("height"); setD(3); setEl(30); },
    },
    {
      title: tx(t, "figRtL8_t", "Quick check"),
      body: <p>{tx(t, "figRtL8_b", "An archer on a 10 m wall sees a target 20° below the horizontal. tan 20° ≈ 0.364.")}</p>,
      quiz: {
        q: tx(t, "figRtL8_q", "How far from the foot of the wall is the target?"),
        options: ["27.5 m", "3.6 m", "9.4 m", "29.2 m"],
        answer: 0,
        why: tx(t, "figRtL8_w", "The wall (10 m) is opposite the angle and the ground distance x is adjacent: tan 20° = 10 / x, so x = 10 / 0.364 ≈ 27.5 m. 3.6 m multiplies instead of dividing; 29.2 m is the line of sight, the hypotenuse."),
      },
    },
  ];

  const tanStep = d * (Math.tan((el + 1) * DEG) - Math.tan(el * DEG));
  const insights: Insight[] = [
    {
      id: "half", tone: "ok", when: mode === "ratios" && th === 30,
      title: tx(t, "figRtI1_t", "Exactly one half"),
      body: tx(t, "figRtI1_b", "At 30° the opposite side is half the hypotenuse at every size: sin 30° = 1/2. It is half of an equilateral triangle."),
    },
    {
      id: "equal", tone: "ok", when: mode === "ratios" && th === 45,
      title: tx(t, "figRtI2_t", "Equal legs"),
      body: tx(t, "figRtI2_b", "At 45° the two legs are equal, so tan 45° = 1 and sin 45° = cos 45° ≈ 0.707 = 1/√2."),
    },
    {
      id: "steep", tone: "warn", when: mode === "ratios" && th >= 75,
      title: tx(t, "figRtI3_t", "The tangent runs away"),
      body: fill(tx(t, "figRtI3_b", "At {th}° the opposite side is {tan} times the adjacent one. Near 90° the adjacent side shrinks to nothing, so the tangent grows without limit; at 90° there is no triangle and tan is undefined."), { th, tan: n2(s / c) }),
    },
    {
      id: "sensitive", tone: "warn", when: mode === "height" && el >= 60,
      title: tx(t, "figRtI4_t", "A steep angle is touchy"),
      body: fill(tx(t, "figRtI4_b", "At {el}°, one more degree adds {dh} m to the height. Surveyors step back until the angle is moderate, so a small error in reading it does not matter much."), { el, dh: n2(tanStep) }),
    },
    {
      id: "h45", tone: "info", when: mode === "height" && el === 45,
      title: tx(t, "figRtI5_t", "Height = distance"),
      body: tx(t, "figRtI5_b", "tan 45° = 1, so at 45° the tower is exactly as tall as you are far from it. Walk back until the top is at 45° and pace the distance."),
    },
  ];

  const title = tx(t, "figRt_title", "Ratios in a right triangle");
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
          tx(t, "figRtR1", "Right triangles with the same angle are similar, so sin, cos and tan depend only on the angle."),
          tx(t, "figRtR2", "sin = opp/hyp, cos = adj/hyp, tan = opp/adj; with hypotenuse 1 the legs are cos θ and sin θ."),
          tx(t, "figRtR3", "Half a square gives 45° (1, 1, √2); half an equilateral triangle gives 30° and 60° (1, √3, 2)."),
          tx(t, "figRtR4", "From a distance and an angle up, h = d · tan θ."),
        ]}
      />
    </>
  );
}
