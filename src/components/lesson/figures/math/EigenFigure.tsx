"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Btn, C, T, Handle, Vec, plot, Grid, useDrag, useFrame, useVisible, type Pt, type Plot } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";
import { type M2, apply, det, eigen, eigvec, rot, n2 } from "./mat2";

// ── What this figure shows ────────────────────────────────────────────────────
// hunt    — a unit vector v (drag it round the circle) and its image Av.
//           Most directions get turned; along an eigenvector Av is parallel
//           to v, and the stretch factor is the eigenvalue λ. The dashed
//           lines are the eigen-directions found from det(A − λI) = 0; the
//           ellipse is where the whole unit circle goes. The Transport
//           sweeps v round the circle.
// iterate — power iteration: apply A again and again (rescaling to length 1
//           each time), one Transport step per application. The vector
//           swings round to the eigenvector with the largest |λ|. A rotation
//           has no real eigenvector, so it never settles.
// The lab: find both eigenvectors, sweep a rotation, then power iteration
// that settles and one that cannot.

type Mode = "hunt" | "iterate";
const W = 560, H = 300;
const DEG = Math.PI / 180;
const SWEEP = 15;                   // degrees per Transport step while hunting
const APPLY_S = 0.8;                // seconds per application while iterating
const START: Pt = { x: -0.2, y: 1 };
const pr = plot({ W, H, x0: -3.73, x1: 3.73, y0: -2, y1: 2 });
const S = (p: Plot, q: Pt) => ({ x: p.X(q.x), y: p.Y(q.y) });
const MATS: [string, string, M2][] = [
  ["sym", "symmetric", [1.5, 0.5, 0.5, 1]],
  ["gen", "general", [1.25, 0.75, 0.25, 0.75]],
  ["shear", "shear", [1, 0.75, 0, 1]],
  ["flip", "mirror", [0, 1, 1, 0]],
  ["rot", "rotation", rot(40)],
];
const matOf = (k: string) => MATS.find(e => e[0] === k)![2];
const unitAt = (phi: number) => ({ x: Math.cos(phi * DEG), y: Math.sin(phi * DEG) });
const wrap = (d: number) => ((d % 360) + 360) % 360;
/** Av for the unit vector at angle phi, and whether it lies on v's own line. */
function image(m: M2, phi: number) {
  const v = unitAt(phi), Av = apply(m, v);
  const cr = v.x * Av.y - v.y * Av.x, lam = v.x * Av.x + v.y * Av.y;
  return { v, Av, lam, aligned: Math.abs(cr) < 0.04 && Math.hypot(Av.x, Av.y) > 1e-6 };
}
/** One power-iteration step: apply m and rescale to length 1. */
const nextOf = (m: M2, q: Pt) => { const a = apply(m, q), l = Math.hypot(a.x, a.y) || 1; return { x: a.x / l, y: a.y / l }; };

// ── The drawings ──────────────────────────────────────────────────────────────

function EigenLines({ m, dim }: { m: M2; dim: boolean }) {
  const ev = eigen(m);
  const dirs = ev.real ? [eigvec(m, ev.l1), eigvec(m, ev.l2)] : [];
  return <>{dirs.map((e, k) =>
    <line key={k} x1={pr.X(-4 * e.x)} y1={pr.Y(-4 * e.y)} x2={pr.X(4 * e.x)} y2={pr.Y(4 * e.y)}
      stroke={dim && k > 0 ? C.muted : C.purple} strokeWidth={1.2} strokeDasharray="6 4" opacity={0.8} />)}</>;
}

function HuntDrawing({ m, phi, active }: { m: M2; phi: number; active: boolean }) {
  const { v, Av, aligned } = image(m, phi);
  const ellipse = Array.from({ length: 73 }, (_, k) => apply(m, { x: Math.cos(k * Math.PI / 36), y: Math.sin(k * Math.PI / 36) }))
    .map((q, k) => `${k ? "L" : "M"}${pr.X(q.x).toFixed(1)},${pr.Y(q.y).toFixed(1)}`).join("");
  return <>
    <Grid p={pr} step={1} />
    <EigenLines m={m} dim={false} />
    <circle cx={pr.X(0)} cy={pr.Y(0)} r={pr.sx} fill="none" stroke={C.muted} strokeWidth={1} strokeDasharray="3 3" />
    <path d={ellipse} fill={C.amber} fillOpacity={0.08} stroke={C.amber} strokeWidth={1.2} />
    <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, Av)} color={aligned ? C.green : C.amber} w={3} />
    <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, v)} color={C.sky} w={2.4} />
    <Handle x={pr.X(v.x)} y={pr.Y(v.y)} color={C.sky} active={active} />
    <T x={pr.X(v.x) + 10} y={pr.Y(v.y) + 14} size={10.5} color={C.sky} bold>v</T>
    <T x={pr.X(Av.x) + 8} y={pr.Y(Av.y) - 6} size={10.5} color={aligned ? C.green : C.amber} bold>Av</T>
  </>;
}

function IterateDrawing({ m, trail }: { m: M2; trail: Pt[] }) {
  const last = trail[trail.length - 1];
  return <>
    <Grid p={pr} step={1} />
    <EigenLines m={m} dim />
    <circle cx={pr.X(0)} cy={pr.Y(0)} r={pr.sx} fill="none" stroke={C.muted} strokeWidth={1} strokeDasharray="3 3" />
    {trail.map((q, k) => k < trail.length - 1 &&
      <Vec key={k} a={S(pr, { x: 0, y: 0 })} b={S(pr, q)} color={C.sky} w={1.4} opacity={0.15 + 0.6 * (k / trail.length)} />)}
    <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, last)} color={C.amber} w={3} />
  </>;
}

/** The svg of the current mode; owns the drag (it is mounted twice while the lab is open). */
function EigStage({ mode, m, phi, setPhi, trail }: { mode: Mode; m: M2; phi: number; setPhi: (d: number) => void; trail: Pt[] }) {
  const drag = useDrag<"v">(
    () => (mode === "hunt" ? "v" : null),
    (_, q) => { const w = pr.inv(q); setPhi(wrap(Math.round(Math.atan2(w.y, w.x) / DEG))); });
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {mode === "hunt" ? <HuntDrawing m={m} phi={phi} active={drag.dragging === "v"} /> : <IterateDrawing m={m} trail={trail} />}
    </svg>
  );
}

export function EigenFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("hunt");
  const [mk, setMk] = useState("sym");
  const [rawPhi, setRawPhi] = useState(100);
  const [swept, setSwept] = useState(0);            // degrees v has been swept by the Transport, since the matrix was chosen
  const [trail, setTrail] = useState<Pt[]>([START]);
  const [clock, setClock] = useState(0);
  const [playing, setPlaying] = useState(false);
  const lab = useLab("math-eigen");
  const vis = useVisible<HTMLDivElement>();

  const m = matOf(mk);
  const phi = Math.round(rawPhi);
  const last = trail[trail.length - 1];
  const applyA = () => setTrail(tr => [...tr.slice(-24), nextOf(m, tr[tr.length - 1])]);
  useFrame(playing && (vis.on || lab.open), dt => {
    if (mode === "hunt") { setRawPhi(wrap(rawPhi + dt * 40)); setSwept(swept + dt * 40); return; }
    const now = clock + dt;
    if (now < APPLY_S) { setClock(now); return; }
    setClock(0);
    applyA();
  });

  const stop = () => { setPlaying(false); setClock(0); };
  const pickMat = (k: string) => { setMk(k); setTrail([START]); setSwept(0); stop(); };
  const pick = (k: Mode) => { setMode(k); stop(); };
  const setPhi = (d: number) => { stop(); setRawPhi(d); };
  const sweepTo = (d: number) => { stop(); setSwept(swept + Math.abs(d - phi)); setRawPhi(wrap(d)); };

  const ev = eigen(m);
  const { v, Av, lam, aligned } = image(m, phi);
  const eigText = ev.real
    ? `λ₁ = ${n2(ev.l1)}   λ₂ = ${n2(ev.l2)}`
    : `λ = ${n2(ev.re)} ± ${n2(ev.im)}i  (${tx(t, "figEig_complex", "no real eigenvector")})`;
  const steps = trail.length - 1;

  const view = (
    <div>
      <EigStage mode={mode} m={m} phi={phi} setPhi={setPhi} trail={trail} />
      {mode === "hunt" ? (
        <Transport t={t} playing={playing}
          onPlay={() => setPlaying(q => !q)}
          playLabel={tx(t, "figEig_sweep", "sweep v round the circle")}
          onStep={() => sweepTo((Math.floor(phi / SWEEP) + 1) * SWEEP)}
          onBack={() => sweepTo((Math.ceil(phi / SWEEP) - 1) * SWEEP)}
          readout={`φ = ${phi}° · ${aligned ? `Av = ${n2(lam)}·v` : tx(t, "figEig_turned", "Av points elsewhere")}`} />
      ) : (
        <Transport t={t} playing={playing}
          onPlay={() => { setClock(0); setPlaying(q => !q); }}
          playLabel={tx(t, "figEig_apply", "apply A")}
          onStep={() => { stop(); applyA(); }}
          onReset={() => { stop(); setTrail([START]); }}
          readout={`${tx(t, "figEig_steps", "steps")}: ${steps} · v = (${n2(last.x)}, ${n2(last.y)})`} />
      )}
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["hunt", tx(t, "figEig_mHunt", "find them")],
    ["iterate", tx(t, "figEig_mIter", "power iteration")],
  ] as const} />;
  const matButtons = <Row>{MATS.map(([k, label]) =>
    <Btn key={k} active={mk === k} onClick={() => pickMat(k)}>{tx(t, `figEig_m_${k}`, label)}</Btn>)}</Row>;
  const controls = mode === "hunt" ? <>
    {matButtons}
    <Row>
      <Readout>{`A = [ ${n2(m[0])}  ${n2(m[1])} ; ${n2(m[2])}  ${n2(m[3])} ]`}</Readout>
      <Readout>{`v = (${n2(v.x)}, ${n2(v.y)})`}</Readout>
      <Readout color={aligned ? C.green : C.amber}>{`Av = (${n2(Av.x)}, ${n2(Av.y)})`}</Readout>
      <Readout color={aligned ? C.green : C.muted}>{aligned
        ? `${tx(t, "figEig_found", "eigenvector!")}  Av = ${n2(lam)}·v`
        : tx(t, "figEig_turned", "Av points elsewhere")}</Readout>
    </Row>
    <Row>
      <Readout color={C.purple}>{`tr = ${n2(m[0] + m[3])}   det = ${n2(det(m))}`}</Readout>
      <Readout color={C.purple}>{eigText}</Readout>
    </Row>
  </> : <>
    {matButtons}
    <Row>
      <Readout color={C.amber}>{`v = (${n2(last.x)}, ${n2(last.y)})`}</Readout>
      <Readout color={C.purple}>{eigText}</Readout>
    </Row>
  </>;
  const note = mode === "hunt"
    ? tx(t, "figEig_noteH2", "Drag v round the dashed unit circle, or press play to sweep it, and watch Av. For most directions the matrix turns v as well as stretching it. Only along the dashed purple lines does Av stay on v's own line; there Av turns green and the readout shows the stretch factor λ, the eigenvalue. A negative λ means Av points the opposite way along the same line. The amber ellipse is where the whole unit circle lands. Try the rotation: no direction survives, and the eigenvalues come out as complex numbers.")
    : tx(t, "figEig_noteI2", "Press ⏭ to apply A once, or play to keep applying it. Each step multiplies the vector by A and rescales it to length 1 (older positions fade). The part of the vector along the eigenvector with the biggest |λ| grows fastest, so after a few steps the vector lines up with the purple line. That is power iteration, the simplest way to find a dominant eigenvector. With the rotation it circles forever, and with the mirror (λ = 1 and −1, equal sizes) it flips back and forth without settling.");

  // ── Lab ──
  const hunt = mode === "hunt";
  const dom = ev.real ? eigvec(m, ev.l1) : null;
  const settled = !!dom && Math.abs(last.x * dom.y - last.y * dom.x) < 0.01;
  const small = ev.real ? Math.min(ev.l1, ev.l2) : 0;
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figEigL1_t", "Hunt for a direction"),
      body: <>
        <p>{tx(t, "figEigL1_b1", "Av is amber while the matrix turns v. It turns green when Av lands on v's own line.")}</p>
        <p>{tx(t, "figEigL1_b2", "Drag v round the circle until Av turns green.")}</p>
      </>,
      goal: { text: tx(t, "figEigL1_g", "Av = λv for some λ."), done: hunt && mk === "sym" && aligned },
      hint: tx(t, "figEigL1_h", "Look for the dashed purple lines: one of them is about 32° above the x-axis."),
      setup: () => { pick("hunt"); pickMat("sym"); setRawPhi(100); },
    },
    {
      title: tx(t, "figEigL2_t", "The other one"),
      body: <>
        <p>{tx(t, "figEigL2_b1", "A 2 × 2 matrix like this one has two eigen-directions, with different stretch factors.")}</p>
        <p>{tx(t, "figEigL2_b2", "Find the direction with the smaller eigenvalue.")}</p>
      </>,
      goal: { text: tx(t, "figEigL2_g", "Av = λ₂v with λ₂ ≈ 0.69."), done: hunt && mk === "sym" && aligned && Math.abs(lam - small) < 0.05 },
      hint: tx(t, "figEigL2_h", "Symmetric matrices have perpendicular eigenvectors: turn v a quarter turn from the first one."),
    },
    {
      title: tx(t, "figEigL3_t", "Quick check"),
      body: <p>{tx(t, "figEigL3_b", "A = [ 2  1 ; 1  2 ]: trace 4, determinant 3, so λ² − 4λ + 3 = 0.")}</p>,
      quiz: {
        q: tx(t, "figEigL3_q", "What are the eigenvalues?"),
        options: ["3 and 1", "2 and 2", "4 and 3", "−3 and −1"],
        answer: 0,
        why: tx(t, "figEigL3_w", "λ² − 4λ + 3 = (λ − 3)(λ − 1). Check: 3 + 1 = 4 is the trace and 3 · 1 = 3 is the determinant."),
      },
    },
    {
      title: tx(t, "figEigL4_t", "A matrix with no such direction"),
      body: <>
        <p>{tx(t, "figEigL4_b1", "Choose the rotation. There are no purple lines.")}</p>
        <p>{tx(t, "figEigL4_b2", "Sweep v at least half way round and look for green.")}</p>
      </>,
      goal: { text: tx(t, "figEigL4_g", "Rotation, swept 180° or more."), done: hunt && mk === "rot" && swept >= 180 },
      focus: "play",
    },
    {
      title: tx(t, "figEigL5_t", "Power iteration"),
      body: <>
        <p>{tx(t, "figEigL5_b1", "Each ⏭ multiplies v by A and shortens it back to length 1.")}</p>
        <p>{tx(t, "figEigL5_b2", "With the general matrix, keep applying A until v sits on the purple line.")}</p>
      </>,
      goal: { text: tx(t, "figEigL5_g", "v lies along the dominant eigenvector."), done: !hunt && mk === "gen" && steps > 0 && settled },
      focus: "step",
      setup: () => { pick("iterate"); pickMat("gen"); },
    },
    {
      title: tx(t, "figEigL6_t", "A tie"),
      body: <>
        <p>{tx(t, "figEigL6_b1", "The mirror has λ = 1 and λ = −1: equal sizes, so neither part outgrows the other.")}</p>
        <p>{tx(t, "figEigL6_b2", "Apply it at least four times and watch.")}</p>
      </>,
      goal: { text: tx(t, "figEigL6_g", "Mirror, 4 steps or more."), done: !hunt && mk === "flip" && steps >= 4 },
      setup: () => { pick("iterate"); pickMat("flip"); },
    },
    {
      title: tx(t, "figEigL7_t", "Quick check"),
      body: <p>{tx(t, "figEigL7_b", "A has eigenvalues 5 and 2. You apply it 10 times to a vector that contains both eigenvectors.")}</p>,
      quiz: {
        q: tx(t, "figEigL7_q", "How much bigger than the 2-part does the 5-part get, compared with the start?"),
        options: ["(5/2)¹⁰ ≈ 9537 times", "10 times", "3 · 10 = 30 times", "5 times"],
        answer: 0,
        why: tx(t, "figEigL7_w", "Each step multiplies the 5-part by 5 and the 2-part by 2, so their ratio grows by 5/2 per step: (5/2)¹⁰ ≈ 9537. That is why the vector soon points along the dominant eigenvector."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "found", tone: "ok", when: hunt && aligned && lam > 0,
      title: tx(t, "figEigI1_t", "Only stretched"),
      body: fill(tx(t, "figEigI1_b", "Along this line A does not turn anything: Av = {l}·v. Every vector on the line is an eigenvector with the same λ."), { l: n2(lam) }),
    },
    {
      id: "neg", tone: "info", when: hunt && aligned && lam < 0,
      title: tx(t, "figEigI2_t", "Flipped along the line"),
      body: fill(tx(t, "figEigI2_b", "λ = {l} is negative: Av lies on v's line but points the other way. That still counts as not turned."), { l: n2(lam) }),
    },
    {
      id: "rot", tone: "warn", when: hunt && mk === "rot",
      title: tx(t, "figEigI3_t", "Every direction turns"),
      body: fill(tx(t, "figEigI3_b", "A rotation turns every v by 40°, so Av is never on v's line. The characteristic equation has discriminant (tr)² − 4 det = {d} < 0: no real λ."), { d: n2((m[0] + m[3]) ** 2 - 4 * det(m)) }),
    },
    {
      id: "shear", tone: "info", when: hunt && mk === "shear",
      title: tx(t, "figEigI4_t", "Only one line"),
      body: tx(t, "figEigI4_b", "The shear's eigenvalue 1 is repeated, but it leaves only the x-axis alone: there is a single eigen-direction, not two."),
    },
    {
      id: "settled", tone: "ok", when: !hunt && steps > 0 && settled,
      title: tx(t, "figEigI5_t", "Settled"),
      body: fill(tx(t, "figEigI5_b", "After {n} steps v has lined up with the eigenvector of λ = {l}, the largest in size. Further steps only stretch it along that line."), { n: steps, l: ev.real ? n2(ev.l1) : "" }),
    },
    {
      id: "flip", tone: "warn", when: !hunt && mk === "flip" && steps >= 2,
      title: tx(t, "figEigI6_t", "No winner"),
      body: tx(t, "figEigI6_b", "With |λ₁| = |λ₂| = 1 neither part grows faster, so v swaps between two positions for ever. Power iteration needs one eigenvalue strictly bigger in size than the rest."),
    },
  ];

  const title = tx(t, "figEig_title", "Directions a matrix only stretches");
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
          tx(t, "figEigR1", "An eigenvector is a direction A does not turn: Av = λv."),
          tx(t, "figEigR2", "A 2 × 2 matrix has two, one or no real eigen-directions; a rotation has none."),
          tx(t, "figEigR3", "The eigenvalues add up to the trace and multiply to the determinant."),
          tx(t, "figEigR4", "Applying A again and again lines any vector up with the eigenvector of largest |λ|, unless two sizes tie."),
        ]}
      />
    </>
  );
}
