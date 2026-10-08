"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Btn, C, T, Handle, plot, Grid, fnPath, useDrag, clamp } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// quadrants — a point at angle θ on the unit circle and its three mirror
//             images. All four share the same reference angle (the acute
//             angle to the x-axis), so their sines and cosines have the same
//             size and differ only in sign, which the quadrant decides.
// graphs    — sin, cos and tan over two full turns in each direction, with a
//             marker at θ (drag anywhere): both waves repeat every 2π, tan
//             every π, and tan shoots off to ±∞ where cos = 0.
// The lab: signs by quadrant, reference angles, then the graphs, the period
// and the tangent's asymptotes.

type Mode = "quadrants" | "graphs";
type Show = { sin: boolean; cos: boolean; tan: boolean };
const W = 560, H = 300;
const TAU = Math.PI * 2;
const n3 = (v: number) => (Math.abs(v) < 5e-4 ? 0 : v).toFixed(3).replace("-", "−");
/** Angle as a multiple of π, e.g. "0.75π". */
const piFmt = (a: number) => `${(+(a / Math.PI).toFixed(2)).toString().replace("-", "−")}π`;
const pc = plot({ W, H, x0: -2.8, x1: 2.8, y0: -1.5, y1: 1.5 });
const pg = plot({ W, H, x0: -2.15 * Math.PI, x1: 2.15 * Math.PI, y0: -2.2, y1: 2.2 });

/** Quadrant (0 on an axis) and reference angle of a whole-degree angle in [0, 360]. */
function quadOf(deg: number) {
  const quad = deg % 90 === 0 ? 0 : Math.floor(deg / 90) + 1;
  const ref = quad === 1 ? deg : quad === 2 ? 180 - deg : quad === 3 ? deg - 180 : quad === 4 ? 360 - deg : Math.min(deg % 180, 180 - (deg % 180));
  return { quad, ref };
}

// ── The drawings ──────────────────────────────────────────────────────────────

function QuadrantsDrawing({ deg, active }: { deg: number; active: boolean }) {
  const th = (deg * Math.PI) / 180, c = Math.cos(th), s = Math.sin(th);
  const { quad, ref } = quadOf(deg);
  const mirrors = [ref, 180 - ref, 180 + ref, 360 - ref];
  const signs = [["+", "+"], ["+", "−"], ["−", "−"], ["−", "+"]];
  const X = pc.X, Y = pc.Y;
  return <>
    <Grid p={pc} step={0.5} labels={false} />
    <circle cx={X(0)} cy={Y(0)} r={pc.sx} fill="none" stroke={C.muted} strokeWidth={1.3} />
    {mirrors.map((m, i) => {
      const a = (m * Math.PI) / 180;
      return <g key={i} opacity={0.35}>
        <line x1={X(0)} y1={Y(0)} x2={X(Math.cos(a))} y2={Y(Math.sin(a))} stroke={C.fg} strokeWidth={1} strokeDasharray="3 3" />
        <circle cx={X(Math.cos(a))} cy={Y(Math.sin(a))} r={4} fill={C.fg} />
      </g>;
    })}
    {[[1.9, 1.2], [-2.6, 1.2], [-2.6, -1.3], [1.9, -1.3]].map(([x, y], i) =>
      <T key={i} x={X(x)} y={Y(y)} size={10} color={quad === i + 1 ? C.fg : C.axis} bold={quad === i + 1}>
        {`${["I", "II", "III", "IV"][i]}  sin ${signs[i][0]}  cos ${signs[i][1]}`}
      </T>)}
    <line x1={X(0)} y1={Y(0)} x2={X(c)} y2={Y(0)} stroke={C.red} strokeWidth={3} />
    <line x1={X(c)} y1={Y(0)} x2={X(c)} y2={Y(s)} stroke={C.green} strokeWidth={3} />
    <line x1={X(0)} y1={Y(0)} x2={X(c)} y2={Y(s)} stroke={C.fg} strokeWidth={1.6} />
    {/* the angle θ from the positive x-axis, and the reference angle to the nearest x-axis */}
    <path d={`M${X(0.25)},${Y(0)} A${0.25 * pc.sx},${0.25 * pc.sy} 0 ${deg > 180 ? 1 : 0} 0 ${X(0.25 * c)},${Y(0.25 * s)}`} fill="none" stroke={C.purple} strokeWidth={2} />
    {quad > 1 && (() => {
      const base = quad === 2 || quad === 3 ? Math.PI : TAU, r0 = 0.45;
      const a0 = base, a1 = th, sweep = a1 > a0 ? 0 : 1;
      return <path d={`M${X(r0 * Math.cos(a0))},${Y(r0 * Math.sin(a0))} A${r0 * pc.sx},${r0 * pc.sy} 0 0 ${sweep} ${X(r0 * c)},${Y(r0 * s)}`} fill="none" stroke={C.amber} strokeWidth={3} />;
    })()}
    <Handle x={X(c)} y={Y(s)} color={C.sky} active={active} />
  </>;
}

function GraphsDrawing({ g, show }: { g: number; show: Show }) {
  const asym = [-1.5, -0.5, 0.5, 1.5].map(k => k * Math.PI);
  return <>
    <Grid p={pg} step={Math.PI / 2} labels={false} />
    {[-2, -1, 1, 2].map(k => <T key={k} x={pg.X(k * Math.PI)} y={pg.Y(0) + 13} size={9} anchor="middle" color={C.axis}>{`${k === 1 ? "" : k === -1 ? "−" : k}π`.replace("-", "−")}</T>)}
    <T x={pg.X(0) - 4} y={pg.Y(1) + 3} size={9} anchor="end" color={C.axis}>1</T>
    <T x={pg.X(0) - 4} y={pg.Y(-1) + 3} size={9} anchor="end" color={C.axis}>−1</T>
    {show.tan && asym.map(a => <line key={a} x1={pg.X(a)} y1={0} x2={pg.X(a)} y2={H} stroke={C.amber} strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />)}
    {show.tan && <path d={fnPath(pg, Math.tan, pg.x0, pg.x1, 1600)} fill="none" stroke={C.amber} strokeWidth={1.8} />}
    {show.cos && <path d={fnPath(pg, Math.cos)} fill="none" stroke={C.red} strokeWidth={2} />}
    {show.sin && <path d={fnPath(pg, Math.sin)} fill="none" stroke={C.green} strokeWidth={2.2} />}
    <line x1={pg.X(g)} y1={0} x2={pg.X(g)} y2={H} stroke={C.purple} strokeWidth={1.2} />
    {show.sin && <circle cx={pg.X(g)} cy={pg.Y(Math.sin(g))} r={4.5} fill={C.green} />}
    {show.cos && <circle cx={pg.X(g)} cy={pg.Y(Math.cos(g))} r={4.5} fill={C.red} />}
    {show.tan && Math.abs(Math.tan(g)) < 2.2 && <circle cx={pg.X(g)} cy={pg.Y(Math.tan(g))} r={4.5} fill={C.amber} />}
  </>;
}

/** The svg of the current mode; owns the drag (it is mounted twice while the lab is open). */
function TgStage({ mode, deg, setDeg, g, setG, show }: {
  mode: Mode; deg: number; setDeg: (v: number) => void; g: number; setG: (v: number) => void; show: Show;
}) {
  const drag = useDrag<"p">(
    () => "p",
    (_, q) => {
      if (mode === "quadrants") {
        const w = pc.inv(q); let a = (Math.atan2(w.y, w.x) * 180) / Math.PI; if (a < 0) a += 360;
        setDeg(Math.round(a) % 360);
      } else setG(clamp(Math.round(pg.inv(q).x * 100) / 100, -TAU, TAU));
    });
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {mode === "quadrants" ? <QuadrantsDrawing deg={deg} active={drag.dragging === "p"} /> : <GraphsDrawing g={g} show={show} />}
    </svg>
  );
}

export function TrigGraphFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("quadrants");
  const [deg, setDeg] = useState(150);
  const [g, setG] = useState(2.3);
  const [show, setShow] = useState<Show>({ sin: true, cos: true, tan: false });
  const lab = useLab("math-trig-graphs");

  const th = (deg * Math.PI) / 180, c = Math.cos(th), s = Math.sin(th);
  const { quad, ref } = quadOf(deg);
  const sg = Math.sin(g), cg = Math.cos(g);

  const view = <TgStage mode={mode} deg={deg} setDeg={setDeg} g={g} setG={setG} show={show} />;
  const modeChoice = <Choice value={mode} onChange={setMode} options={[
    ["quadrants", tx(t, "figTg_mQuad", "quadrants")],
    ["graphs", tx(t, "figTg_mGraphs", "graphs")],
  ] as const} />;
  const controls = mode === "quadrants" ? <>
    <Slider label={tx(t, "figTg_theta", "angle θ")} value={deg} min={0} max={360} step={1} onChange={setDeg} fmt={v => `${v}°`} width="w-16" />
    <Row>
      <Readout color={C.purple}>{`θ = ${deg}° = ${piFmt(th)} rad`}</Readout>
      <Readout color={C.amber}>{`${tx(t, "figTg_ref", "reference angle")} = ${ref}°`}</Readout>
      <Readout color={C.red}>{`cos θ = ${n3(c)}`}</Readout>
      <Readout color={C.green}>{`sin θ = ${n3(s)}`}</Readout>
      <Readout>{`sin ${ref}° = ${n3(Math.sin((ref * Math.PI) / 180))}`}</Readout>
    </Row>
  </> : <>
    <Row>
      {(["sin", "cos", "tan"] as const).map(k => <Btn key={k} active={show[k]} onClick={() => setShow(v => ({ ...v, [k]: !v[k] }))}>{k}</Btn>)}
    </Row>
    <Slider label="θ" value={g} min={-TAU} max={TAU} step={0.01} onChange={setG} fmt={piFmt} width="w-6" />
    <Row>
      <Readout color={C.green}>{`sin = ${n3(sg)}`}</Readout>
      <Readout color={C.red}>{`cos = ${n3(cg)}`}</Readout>
      <Readout color={C.amber}>{`tan = ${Math.abs(cg) < 1e-3 ? "±∞" : n3(Math.tan(g))}`}</Readout>
      <Readout>{`sin(θ + 2π) = ${n3(Math.sin(g + TAU))}`}</Readout>
    </Row>
  </>;
  const note = mode === "quadrants"
    ? tx(t, "figTg_noteQ", "Drag the point around the circle. Its cosine is the red horizontal leg and its sine the green vertical one, with signs: left of the y-axis cos is negative, below the x-axis sin is negative. The amber arc is the reference angle, the sharp angle between the radius and the nearest part of the x-axis. The four faded points (θ reflected in the axes) share that reference angle, so their sines and cosines are the same numbers with different signs. Every angle's values come from an angle between 0° and 90°.")
    : tx(t, "figTg_noteG2", "Drag across the graph to move θ. Unrolled over two turns each way, sine and cosine are the same wave shifted by a quarter turn (π/2), and they repeat every 2π: going once more around the circle brings the point back. Turn on tan: it repeats every π, crosses zero where sine does and has vertical asymptotes (dashed) where cosine is zero, since it divides by the cosine. Negative angles turn clockwise; sine is odd (sin(−θ) = −sin θ) and cosine is even (cos(−θ) = cos θ).");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figTgL1_t", "Signs come from the quadrant"),
      body: <>
        <p>{tx(t, "figTgL1_b1", "cos θ is the point's x and sin θ its y, so each is negative on its own side of an axis.")}</p>
        <p>{tx(t, "figTgL1_b2", "Drag the point into the quadrant where both are negative.")}</p>
      </>,
      goal: { text: tx(t, "figTgL1_g", "sin θ < 0 and cos θ < 0."), done: mode === "quadrants" && quad === 3 },
      hint: tx(t, "figTgL1_h", "Left of the y-axis and below the x-axis: quadrant III."),
      setup: () => { setMode("quadrants"); setDeg(30); },
    },
    {
      title: tx(t, "figTgL2_t", "Same size, other sign"),
      body: <>
        <p>{tx(t, "figTgL2_b1", "The amber arc is the reference angle: the sharp angle down to the x-axis. The four faded points share it.")}</p>
        <p>{tx(t, "figTgL2_b2", "Find the angle in quadrant II whose sine equals sin 30°.")}</p>
      </>,
      goal: { text: tx(t, "figTgL2_g", "An angle in II with sin θ = 0.500."), done: mode === "quadrants" && deg === 150 },
      hint: tx(t, "figTgL2_h", "Mirror 30° in the y-axis: 180° − 30°."),
      setup: () => { setMode("quadrants"); setDeg(30); },
    },
    {
      title: tx(t, "figTgL3_t", "Quick check"),
      body: <p>{tx(t, "figTgL3_b", "Quadrant, then reference angle, then sign.")}</p>,
      quiz: {
        q: tx(t, "figTgL3_q", "What is cos 240°?"),
        options: ["−1/2", "1/2", "−√3/2", "√3/2"],
        answer: 0,
        why: tx(t, "figTgL3_w", "240° is in quadrant III, reference angle 240° − 180° = 60°, and the cosine is negative there: −cos 60° = −1/2."),
      },
    },
    {
      title: tx(t, "figTgL4_t", "The waves"),
      body: <>
        <p>{tx(t, "figTgL4_b1", "Here θ runs along the horizontal axis, two full turns each way.")}</p>
        <p>{tx(t, "figTgL4_b2", "Move θ to a place where the sine is at its lowest.")}</p>
      </>,
      goal: { text: tx(t, "figTgL4_g", "sin θ = −1."), done: mode === "graphs" && sg < -0.9999 },
      hint: tx(t, "figTgL4_h", "Three quarters of a turn, 3π/2, or a quarter turn backwards, −π/2."),
      setup: () => { setMode("graphs"); setG(0.5); setShow({ sin: true, cos: true, tan: false }); },
    },
    {
      title: tx(t, "figTgL5_t", "Quick check"),
      body: <p>{tx(t, "figTgL5_b", "Compare the green wave left and right of θ = 0.")}</p>,
      quiz: {
        q: tx(t, "figTgL5_q", "sin(−θ) equals…"),
        options: ["−sin θ", "sin θ", "cos θ", "−cos θ"],
        answer: 0,
        why: tx(t, "figTgL5_w", "Turning backwards mirrors the point in the x-axis: its height changes sign. Sine is odd; cosine, the x, is even."),
      },
    },
    {
      title: tx(t, "figTgL6_t", "The tangent's walls"),
      body: <>
        <p>{tx(t, "figTgL6_b1", "tan θ = sin θ / cos θ divides by the red wave. Switch it on.")}</p>
        <p>{tx(t, "figTgL6_b2", "Move θ right next to one of the dashed lines.")}</p>
      </>,
      goal: { text: tx(t, "figTgL6_g", "tan on, and |tan θ| > 10."), done: mode === "graphs" && show.tan && Math.abs(Math.tan(g)) > 10 },
      hint: tx(t, "figTgL6_h", "The dashed lines sit at ±π/2 and ±3π/2, where cos θ = 0."),
      setup: () => { setMode("graphs"); setG(0.5); },
    },
    {
      title: tx(t, "figTgL7_t", "Quick check"),
      body: <p>{tx(t, "figTgL7_b", "Count the distance between two dashed lines.")}</p>,
      quiz: {
        q: tx(t, "figTgL7_q", "After what step does the tangent repeat itself?"),
        options: ["π", "2π", "π/2", "4π"],
        answer: 0,
        why: tx(t, "figTgL7_w", "Half a turn takes the point to the opposite side: sine and cosine both flip sign, so their ratio is unchanged. tan repeats every π, sin and cos only every 2π."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "axis", tone: "info", when: mode === "quadrants" && quad === 0,
      title: tx(t, "figTgI1_t", "On an axis"),
      body: fill(tx(t, "figTgI1_b", "At {deg}° the point is on an axis, in no quadrant. One of sin and cos is 0, the other is ±1."), { deg }),
    },
    {
      id: "wall", tone: "warn", when: mode === "graphs" && show.tan && Math.abs(cg) < 0.1,
      title: tx(t, "figTgI2_t", "Near an asymptote"),
      body: fill(tx(t, "figTgI2_b", "cos θ = {c}, almost 0, so tan θ = sin θ / cos θ = {tan}. At the dashed line it divides by zero and has no value."), { c: n3(cg), tan: n3(Math.tan(g)) }),
    },
    {
      id: "cross", tone: "ok", when: mode === "graphs" && show.sin && show.cos && Math.abs(sg - cg) < 0.01,
      title: tx(t, "figTgI3_t", "The waves cross"),
      body: tx(t, "figTgI3_b", "sin θ = cos θ: the point is on the diagonal y = x. That happens at π/4 and every half turn from it, where tan θ = 1."),
    },
  ];

  const title = tx(t, "figTg_title", "Every angle, every sign");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        {view}
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figTgR1", "The quadrant decides the signs: cos is negative left of the y-axis, sin below the x-axis."),
          tx(t, "figTgR2", "The reference angle decides the sizes: every angle reuses the values of one between 0° and 90°."),
          tx(t, "figTgR3", "sin and cos repeat every 2π, tan every π; sin is odd and cos is even."),
          tx(t, "figTgR4", "tan has vertical asymptotes wherever cos θ = 0."),
        ]}
      />
    </>
  );
}
