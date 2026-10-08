"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, plot, Grid, clamp, useRaf, type Pt } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// Each conic drawn from its distance rule, with a point P that walks along it
// (the Transport) and the distances that stay constant:
// parabola  — distance to the focus = distance to the directrix. Rays coming
//             straight down bounce off it into the focus.
// ellipse   — distance to F₁ + distance to F₂ = 2a (the string-and-pins
//             construction).
// hyperbola — |distance to F₁ − distance to F₂| = 2a, with its asymptotes.
// The lab: walk P round an ellipse, squash it into a circle, narrow a
// parabola and open a hyperbola, reading the eccentricity each time.

type Mode = "parabola" | "ellipse" | "hyperbola";
const W = 560, H = 300;
const p = plot({ W, H, x0: -7.467, x1: 7.467, y0: -4, y1: 4 });
const n2 = (v: number) => (+v.toFixed(2)).toString().replace("-", "−");
const X = (q: Pt) => p.X(q.x), Y = (q: Pt) => p.Y(q.y);
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const path = (q: Pt[]) => q.map((v, i) => `${i ? "L" : "M"}${X(v).toFixed(1)},${Y(v).toFixed(1)}`).join("");
const V0 = -2.5;                                    // the parabola's vertex height
const wrap = (v: number) => ((v % 1) + 1) % 1;

/** Everything about the current conic: foci, P, the constant and the eccentricity. */
function conic(mode: Mode, pf: number, a: number, c: number, ha: number, hc: number, s: number) {
  if (mode === "parabola") {
    const f = (x: number) => V0 + (x * x) / (4 * pf);
    const F = { x: 0, y: V0 + pf }, dy = V0 - pf;
    const x = s * 12 - 6;
    return { kind: mode, f, F, dy, P: { x, y: f(x) }, e: 1 } as const;
  }
  if (mode === "ellipse") {
    const cc = clamp(c, Math.sqrt(Math.max(0, a * a - 3.8 * 3.8)), a - 0.05);
    const b = Math.sqrt(a * a - cc * cc), ang = s * Math.PI * 2;
    return { kind: mode, a, b, cc, F1: { x: -cc, y: 0 }, F2: { x: cc, y: 0 }, P: { x: a * Math.cos(ang), y: b * Math.sin(ang) }, e: cc / a } as const;
  }
  const cc = Math.max(hc, ha + 0.1);
  const b = Math.sqrt(cc * cc - ha * ha), yP = (s - 0.5) * 7.6;
  return { kind: mode, a: ha, b, cc, F1: { x: -cc, y: 0 }, F2: { x: cc, y: 0 }, P: { x: ha * Math.sqrt(1 + (yP / b) ** 2), y: yP }, e: cc / ha } as const;
}
type Conic = ReturnType<typeof conic>;

// ── The drawing ───────────────────────────────────────────────────────────────

function ConicDrawing({ k, t }: { k: Conic; t?: TrackTranslations }) {
  const foci = (F1: Pt, F2: Pt) => <>
    <circle cx={X(F1)} cy={Y(F1)} r={4.5} fill={C.amber} />
    <circle cx={X(F2)} cy={Y(F2)} r={4.5} fill={C.amber} />
    <T x={X(F1)} y={Y(F1) + 16} size={10} anchor="middle" color={C.amber} bold>F₁</T>
    <T x={X(F2)} y={Y(F2) + 16} size={10} anchor="middle" color={C.amber} bold>F₂</T>
  </>;
  const Pdot = (P: Pt) => <>
    <circle cx={X(P)} cy={Y(P)} r={5.5} fill={C.pink} />
    <T x={X(P) + 9} y={Y(P) - 8} size={11} color={C.pink} bold>P</T>
  </>;

  if (k.kind === "parabola") {
    const curve = Array.from({ length: 121 }, (_, i) => { const xx = -7.5 + i * 0.125; return { x: xx, y: k.f(xx) }; });
    return <>
      <Grid p={p} step={1} labels={false} />
      {[-5, -3.5, -2, 2, 3.5, 5].map(rx => {
        const hit = { x: rx, y: k.f(rx) };
        return hit.y < 4 && <path key={rx} d={path([{ x: rx, y: 4 }, hit, k.F])} fill="none" stroke={C.teal} strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />;
      })}
      <line x1={0} y1={p.Y(k.dy)} x2={W} y2={p.Y(k.dy)} stroke={C.purple} strokeWidth={2} />
      <T x={8} y={p.Y(k.dy) - 5} size={9.5} color={C.purple} bold>{tx(t, "figCon_directrix", "directrix")}</T>
      <path d={path(curve)} fill="none" stroke={C.sky} strokeWidth={2.4} />
      <line x1={X(k.P)} y1={Y(k.P)} x2={X(k.F)} y2={Y(k.F)} stroke={C.green} strokeWidth={2} />
      <line x1={X(k.P)} y1={Y(k.P)} x2={X(k.P)} y2={p.Y(k.dy)} stroke={C.green} strokeWidth={2} strokeDasharray="5 3" />
      <circle cx={X(k.F)} cy={Y(k.F)} r={4.5} fill={C.amber} />
      <T x={X(k.F) + 8} y={Y(k.F) + 4} size={10} color={C.amber} bold>F</T>
      {Pdot(k.P)}
    </>;
  }
  if (k.kind === "ellipse") {
    return <>
      <Grid p={p} step={1} labels={false} />
      <ellipse cx={p.X(0)} cy={p.Y(0)} rx={k.a * p.sx} ry={k.b * p.sy} fill={C.sky} fillOpacity={0.07} stroke={C.sky} strokeWidth={2.4} />
      <line x1={p.X(-k.a)} y1={p.Y(0)} x2={p.X(k.a)} y2={p.Y(0)} stroke={C.muted} strokeWidth={0.8} strokeDasharray="4 3" />
      <line x1={p.X(0)} y1={p.Y(-k.b)} x2={p.X(0)} y2={p.Y(k.b)} stroke={C.muted} strokeWidth={0.8} strokeDasharray="4 3" />
      <T x={p.X(k.a / 2)} y={p.Y(0) - 5} size={9.5} anchor="middle" color={C.muted}>a</T>
      <T x={p.X(0) + 5} y={p.Y(k.b / 2)} size={9.5} color={C.muted}>b</T>
      <path d={path([k.F1, k.P, k.F2])} fill="none" stroke={C.green} strokeWidth={2} strokeLinejoin="round" />
      {foci(k.F1, k.F2)}
      {Pdot(k.P)}
    </>;
  }
  const branch = (sg: number) => Array.from({ length: 121 }, (_, i) => { const y = -4.2 + i * 0.07; return { x: sg * k.a * Math.sqrt(1 + (y / k.b) ** 2), y }; });
  return <>
    <Grid p={p} step={1} labels={false} />
    <line {...{ x1: p.X(-8), y1: p.Y((-8 * k.b) / k.a), x2: p.X(8), y2: p.Y((8 * k.b) / k.a) }} stroke={C.muted} strokeWidth={1} strokeDasharray="5 4" />
    <line {...{ x1: p.X(-8), y1: p.Y((8 * k.b) / k.a), x2: p.X(8), y2: p.Y((-8 * k.b) / k.a) }} stroke={C.muted} strokeWidth={1} strokeDasharray="5 4" />
    <path d={path(branch(1))} fill="none" stroke={C.sky} strokeWidth={2.4} />
    <path d={path(branch(-1))} fill="none" stroke={C.sky} strokeWidth={2.4} />
    <line x1={X(k.P)} y1={Y(k.P)} x2={X(k.F1)} y2={Y(k.F1)} stroke={C.green} strokeWidth={2} />
    <line x1={X(k.P)} y1={Y(k.P)} x2={X(k.F2)} y2={Y(k.F2)} stroke={C.green} strokeWidth={2} strokeDasharray="5 3" />
    {foci(k.F1, k.F2)}
    {Pdot(k.P)}
  </>;
}

export function ConicFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("ellipse");
  const [pf, setPf] = useState(1);
  const [a, setA] = useState(4), [c, setC] = useState(2.5);
  const [ha, setHa] = useState(1.5), [hc, setHc] = useState(2.5);
  const [s, setS] = useState(0.35);
  const [playing, setPlaying] = useState(false);
  const [lap, setLap] = useState(0);                   // how far P has walked while playing, for the lab
  const lab = useLab("math-conics");

  const ref = useRaf(playing, dt => {
    const d = dt * 0.12;
    setS(v => wrap(v + d));
    setLap(v => v + d);
  });
  const pick = (m: Mode) => { setMode(m); setS(0.35); setPlaying(false); };
  const nudge = (d: number) => { setPlaying(false); setS(v => wrap(Math.round(v * 12 + d) / 12)); };

  const k = conic(mode, pf, a, c, ha, hc, s);
  const view = (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto"><ConicDrawing k={k} t={t} /></svg>
      <Transport t={t} playing={playing}
        onPlay={() => setPlaying(v => !v)}
        playLabel={tx(t, "figCon_play", "walk P along the curve")}
        onStep={() => nudge(1)}
        onBack={() => nudge(-1)}
        readout={k.kind === "ellipse" ? `${Math.round(s * 360)}°` : `${k.kind === "parabola" ? "x" : "y"} = ${n2(k.kind === "parabola" ? k.P.x : k.P.y)}`} />
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["parabola", tx(t, "figCon_mPar", "parabola")],
    ["ellipse", tx(t, "figCon_mEll", "ellipse")],
    ["hyperbola", tx(t, "figCon_mHyp", "hyperbola")],
  ] as const} />;

  let controls: React.ReactNode, note: string;
  if (k.kind === "parabola") {
    controls = <>
      <Slider label={tx(t, "figCon_p", "focus distance p")} value={pf} min={0.25} max={1.5} step={0.05} onChange={setPf} fmt={n2} width="w-28" />
      <Row>
        <Readout color={C.green}>{`PF = ${n2(dist(k.P, k.F))}`}</Readout>
        <Readout color={C.green}>{`${tx(t, "figCon_pd", "P to directrix")} = ${n2(k.P.y - k.dy)}`}</Readout>
        <Readout color={C.sky}>{`y + 2.5 = x² / ${n2(4 * pf)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figCon_noteP2", "A parabola is every point that is as far from a point, the focus F, as from a line, the directrix. Press play to walk P along it: the solid and the dashed green segments are always equal. The dashed teal rays show why dishes and headlights are parabolic: every ray coming straight down bounces off the curve into the focus, and a lamp at the focus sends its light out in a parallel beam. Moving the focus closer to the directrix makes the parabola narrower.");
  } else if (k.kind === "ellipse") {
    controls = <>
      <Sliders>
        <Slider label={tx(t, "figCon_a", "half-width a")} value={a} min={1} max={6} step={0.1} onChange={setA} fmt={n2} />
        <Slider label={tx(t, "figCon_c", "focus distance c")} value={c} min={0} max={6} step={0.1} onChange={setC} fmt={() => n2(k.cc)} />
      </Sliders>
      <Row>
        <Readout color={C.green}>{`PF₁ + PF₂ = ${n2(dist(k.P, k.F1))} + ${n2(dist(k.P, k.F2))} = ${n2(dist(k.P, k.F1) + dist(k.P, k.F2))} = 2a`}</Readout>
        <Readout color={C.sky}>{`x²/${n2(a * a)} + y²/${n2(k.b * k.b)} = 1`}</Readout>
        <Readout>{`b = √(a² − c²) = ${n2(k.b)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figCon_noteE2", "Pin a loop of string at the two foci F₁ and F₂ and pull it tight with a pencil: the pencil traces an ellipse, because the two pieces of string always add up to the same length, 2a. Press play to walk P round and check the sum. Push the foci together (c = 0) and you get a circle; pull them apart and the ellipse flattens. Planets orbit the Sun on ellipses with the Sun at one focus.");
  } else {
    controls = <>
      <Sliders>
        <Slider label={tx(t, "figCon_a", "half-width a")} value={ha} min={0.5} max={3.5} step={0.1} onChange={setHa} fmt={n2} />
        <Slider label={tx(t, "figCon_c", "focus distance c")} value={hc} min={0.6} max={6} step={0.1} onChange={setHc} fmt={() => n2(k.cc)} />
      </Sliders>
      <Row>
        <Readout color={C.green}>{`PF₁ − PF₂ = ${n2(dist(k.P, k.F1))} − ${n2(dist(k.P, k.F2))} = ${n2(dist(k.P, k.F1) - dist(k.P, k.F2))} = 2a`}</Readout>
        <Readout color={C.sky}>{`x²/${n2(ha * ha)} − y²/${n2(k.b * k.b)} = 1`}</Readout>
        <Readout>{`${tx(t, "figCon_asym", "asymptotes")} y = ±${n2(k.b / ha)}x`}</Readout>
      </Row>
    </>;
    note = tx(t, "figCon_noteH", "A hyperbola is every point whose distances to two foci differ by the same amount, 2a. It has two separate branches, one near each focus, and far away each branch runs alongside a straight dashed line, an asymptote, without ever touching it. Hyperbolas locate things from timing: if a sound reaches two microphones 1 ms apart, the source lies on a hyperbola with the microphones as foci.");
  }
  const allControls = <>{controls}<Row><Readout color={C.amber}>{`${tx(t, "figCon_e", "eccentricity")} e = ${k.e === 1 ? "1" : n2(k.e)}`}</Readout></Row></>;

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figConL1_t", "String and pins"),
      body: <>
        <p>{tx(t, "figConL1_b1", "The two green segments are a loop of string pinned at F₁ and F₂ and pulled tight by P. Their total is always 2a = 8.")}</p>
        <p>{tx(t, "figConL1_b2", "Press play and let P walk all the way round. Watch the sum in the readout.")}</p>
      </>,
      goal: { text: tx(t, "figConL1_g", "Walk P a full lap."), done: mode === "ellipse" && lap >= 1 },
      focus: "play",
      setup: () => { pick("ellipse"); setA(4); setC(2.5); setLap(0); },
    },
    {
      title: tx(t, "figConL2_t", "Squash it into a circle"),
      body: <p>{tx(t, "figConL2_b", "The eccentricity e = c / a measures how far the foci are pulled apart. Push them together until the ellipse is round.")}</p>,
      goal: { text: tx(t, "figConL2_g", "e = 0."), done: mode === "ellipse" && k.e === 0 },
      hint: tx(t, "figConL2_h", "Drag the focus distance c all the way down to 0."),
      setup: () => { pick("ellipse"); setA(3); setC(2); },
    },
    {
      title: tx(t, "figConL3_t", "Quick check"),
      body: <p>{tx(t, "figConL3_b", "b = √(a² − c²): half the height comes from Pythagoras.")}</p>,
      quiz: {
        q: tx(t, "figConL3_q", "An ellipse has a = 5 and c = 3. What is b?"),
        options: ["4", "2", "8", "√34"],
        answer: 0,
        why: tx(t, "figConL3_w", "√(25 − 9) = √16 = 4: the 3-4-5 triangle again, with the string from a focus to the top of the ellipse as hypotenuse a."),
      },
    },
    {
      title: tx(t, "figConL4_t", "A narrower parabola"),
      body: <p>{tx(t, "figConL4_b", "Each point of a parabola is as far from the focus as from the directrix. Move the focus closer to the directrix and watch the shape.")}</p>,
      goal: { text: tx(t, "figConL4_g", "p ≤ 0.5."), done: mode === "parabola" && pf <= 0.5 + 1e-9 },
      setup: () => { pick("parabola"); setPf(1); },
    },
    {
      title: tx(t, "figConL5_t", "Quick check"),
      body: <p>{tx(t, "figConL5_b", "A point P on a parabola is 3 units from the focus.")}</p>,
      quiz: {
        q: tx(t, "figConL5_q", "How far is P from the directrix?"),
        options: ["3", "6", "1.5", tx(t, "figConL5_o4", "it depends on p")],
        answer: 0,
        why: tx(t, "figConL5_w", "That is the definition: on a parabola the two distances are always equal."),
      },
    },
    {
      title: tx(t, "figConL6_t", "Open the hyperbola"),
      body: <p>{tx(t, "figConL6_b", "For a hyperbola e = c / a is more than 1. Pull the foci further out, or shrink a, until e is at least 2, and watch the asymptotes.")}</p>,
      goal: { text: tx(t, "figConL6_g", "e ≥ 2."), done: mode === "hyperbola" && k.e >= 2 - 1e-9 },
      setup: () => { pick("hyperbola"); setHa(1.5); setHc(2.5); },
    },
    {
      title: tx(t, "figConL7_t", "Quick check"),
      body: <p>{tx(t, "figConL7_b", "The eccentricity alone names the conic.")}</p>,
      quiz: {
        q: tx(t, "figConL7_q", "An orbit has eccentricity e = 0.5. What shape is it?"),
        options: [tx(t, "figConL7_o1", "an ellipse"), tx(t, "figConL7_o2", "a parabola"), tx(t, "figConL7_o3", "a hyperbola"), tx(t, "figConL7_o4", "a circle")],
        answer: 0,
        why: tx(t, "figConL7_w", "0 < e < 1 is an ellipse; e = 0 a circle, e = 1 a parabola, e > 1 a hyperbola. A comet on a hyperbola passes once and never comes back."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "circle", tone: "ok", when: k.kind === "ellipse" && k.e === 0,
      title: tx(t, "figConI1_t", "A circle"),
      body: tx(t, "figConI1_b", "With c = 0 both foci sit at the centre, the two strings are each a radius, and b = a: the ellipse is a circle of radius a."),
    },
    {
      id: "flat", tone: "info", when: k.kind === "ellipse" && k.e > 0.9,
      title: tx(t, "figConI2_t", "Nearly flat"),
      body: fill(tx(t, "figConI2_b", "e = {e}: the foci are almost at the ends, so the string has little slack left over and the ellipse is squashed to b = {b}."), { e: n2(k.e), b: n2(k.kind === "ellipse" ? k.b : 0) }),
    },
    {
      id: "par", tone: "info", when: k.kind === "parabola",
      title: tx(t, "figConI3_t", "Equal distances"),
      body: fill(tx(t, "figConI3_b", "PF = {d} and P to the directrix = {d}: every point of the curve is equally far from both."), { d: n2(k.kind === "parabola" ? dist(k.P, k.F) : 0) }),
    },
    {
      id: "wide", tone: "info", when: k.kind === "hyperbola" && k.e >= 2,
      title: tx(t, "figConI4_t", "Wide open"),
      body: fill(tx(t, "figConI4_b", "e = {e}. The asymptotes have slope ±{m}: the bigger e, the steeper they are and the more the branches open."), { e: n2(k.e), m: n2(k.kind === "hyperbola" ? k.b / k.a : 0) }),
    },
  ];

  const title = tx(t, "figCon_title", "Conics from distances");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={allControls}
        note={note}
      >
        <div ref={ref}>{view}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{modeChoice}</Row>{allControls}</>}
        recap={[
          tx(t, "figConR1", "Ellipse: the distances to two foci add to 2a; a circle is the ellipse with e = 0."),
          tx(t, "figConR2", "Parabola: as far from the focus as from the directrix, e = 1."),
          tx(t, "figConR3", "Hyperbola: the distances differ by 2a, e > 1, two branches hugging their asymptotes."),
        ]}
      />
    </>
  );
}
