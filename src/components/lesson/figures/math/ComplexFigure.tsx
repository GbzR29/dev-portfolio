"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, C, T, Handle, Vec, plot, Grid, useDrag, useFrame, useVisible, nearest, clamp, type Pt, type Plot } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// add      — complex numbers add like vectors: the parallelogram rule.
// multiply — z·w has length |z|·|w| and angle arg z + arg w: multiplying by w
//            scales by |w| and turns by arg w.
// powers   — 1, z, z², z³, … : each step turns by arg z and scales by |z|, so
//            the points spiral out (|z| > 1), in (|z| < 1) or go round (|z| = 1).
//            The Transport adds one power at a time.
// roots    — the n solutions of zⁿ = 1 sit evenly round the unit circle, one
//            n-th of a turn apart. The Transport walks ω, ω², … round them.
// The lab: a sum, a quarter turn, landing on 2, powers that close up, then
// the fourth roots of 1.

type Mode = "add" | "multiply" | "powers" | "roots";
const W = 560, H = 300;
const MAXP = 24;                    // the most powers drawn
const TICK = 0.6;                   // seconds per Transport step while playing
const S = (p: Plot, q: Pt) => ({ x: p.X(q.x), y: p.Y(q.y) });
const cmul = (a: Pt, b: Pt): Pt => ({ x: a.x * b.x - a.y * b.y, y: a.x * b.y + a.y * b.x });
const n2 = (v: number) => (Math.abs(v) < 5e-3 ? 0 : v).toFixed(2).replace("-", "−");
const deg = (p: Pt) => (Math.atan2(p.y, p.x) * 180) / Math.PI;
const cstr = (p: Pt) => `${n2(p.x)} ${p.y < -5e-3 ? "−" : "+"} ${n2(Math.abs(p.y))}i`;
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (k: number) => String(k).split("").map(d => SUP[+d]).join("");
const wide = plot({ W, H, x0: -5.6, x1: 5.6, y0: -3, y1: 3 });
const zoom = plot({ W, H, x0: -2.8, x1: 2.8, y0: -1.5, y1: 1.5 });
const near = (a: Pt, b: Pt, e: number) => Math.abs(a.x - b.x) < e && Math.abs(a.y - b.y) < e;
/** 1, z, z², … up to z^MAXP. */
const powersOf = (z: Pt) => { const pts: Pt[] = [{ x: 1, y: 0 }]; for (let k = 1; k <= MAXP; k++) pts.push(cmul(pts[k - 1], z)); return pts; };
const rootsOf = (n: number) => Array.from({ length: n }, (_, k) => ({ x: Math.cos((2 * Math.PI * k) / n), y: Math.sin((2 * Math.PI * k) / n) }));

// ── The drawing ───────────────────────────────────────────────────────────────

type Shared = { mode: Mode; z: Pt; w: Pt; zp: Pt; n: number; shown: number; rk: number };

/** The svg of the current mode; owns the drag (it is mounted twice while the lab is open). */
function CxStage({ st, setZ, setW, setZp, t }: { st: Shared; setZ: (v: Pt) => void; setW: (v: Pt) => void; setZp: (v: Pt) => void; t?: TrackTranslations }) {
  const { mode, z, w, zp, n, shown, rk } = st;
  const pr = mode === "powers" || mode === "roots" ? zoom : wide;
  const drag = useDrag<"z" | "w">(
    q => (mode === "roots" ? null : mode === "powers" ? nearest<"z" | "w">(q, [["z", S(pr, zp)]], 22) : nearest<"z" | "w">(q, [["z", S(pr, z)], ["w", S(pr, w)]], 18)),
    (id, q) => {
      const p = pr.inv(q);
      if (mode === "powers") { setZp({ x: clamp(Math.round(p.x * 50) / 50, -1.4, 1.4), y: clamp(Math.round(p.y * 50) / 50, -1.4, 1.4) }); return; }
      const s = { x: clamp(Math.round(p.x * 20) / 20, -5.3, 5.3), y: clamp(Math.round(p.y * 20) / 20, -2.8, 2.8) };
      (id === "z" ? setZ : setW)(s);
    });

  const O = S(pr, { x: 0, y: 0 });
  const arc = (r: number, a0: number, a1: number, col: string) => {
    const A0 = (a0 * Math.PI) / 180, A1 = (a1 * Math.PI) / 180;
    return <path d={`M${pr.X(r * Math.cos(A0))},${pr.Y(r * Math.sin(A0))} A${r * pr.sx},${r * pr.sy} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 0 : 1} ${pr.X(r * Math.cos(A1))},${pr.Y(r * Math.sin(A1))}`} fill="none" stroke={col} strokeWidth={1.8} />;
  };
  const dot = (p: Pt, col: string, label: string, dy = -8) => <>
    <circle cx={pr.X(p.x)} cy={pr.Y(p.y)} r={5} fill={col} />
    <T x={pr.X(p.x) + 8} y={pr.Y(p.y) + dy} size={10.5} color={col} bold>{label}</T>
  </>;
  const handles = (both: boolean, zz = z) => <>
    <Handle x={pr.X(zz.x)} y={pr.Y(zz.y)} color={C.sky} active={drag.dragging === "z"} />
    <T x={pr.X(zz.x) + 10} y={pr.Y(zz.y) + 15} size={10.5} color={C.sky} bold>z</T>
    {both && <>
      <Handle x={pr.X(w.x)} y={pr.Y(w.y)} color={C.pink} active={drag.dragging === "w"} />
      <T x={pr.X(w.x) + 10} y={pr.Y(w.y) + 15} size={10.5} color={C.pink} bold>w</T>
    </>}
  </>;
  const axisNames = <>
    <T x={W - 6} y={pr.Y(0) - 5} size={9} anchor="end" color={C.muted}>{tx(t, "figCx_re", "real")}</T>
    <T x={pr.X(0) + 5} y={11} size={9} color={C.muted}>{tx(t, "figCx_im", "imaginary")}</T>
  </>;

  let body: React.ReactNode;
  if (mode === "add") {
    const s = { x: z.x + w.x, y: z.y + w.y };
    body = <>
      <Grid p={pr} step={1} />{axisNames}
      <Vec a={O} b={S(pr, z)} color={C.sky} w={2.4} />
      <Vec a={O} b={S(pr, w)} color={C.pink} w={2.4} />
      <Vec a={S(pr, z)} b={S(pr, s)} color={C.pink} w={1.4} dash="4 3" />
      <Vec a={S(pr, w)} b={S(pr, s)} color={C.sky} w={1.4} dash="4 3" />
      <Vec a={O} b={S(pr, s)} color={C.amber} w={3} />
      {dot(s, C.amber, "z + w")}
      {handles(true)}
    </>;
  } else if (mode === "multiply") {
    const p = cmul(z, w), az = deg(z), aw = deg(w);
    body = <>
      <Grid p={pr} step={1} />{axisNames}
      <circle cx={O.x} cy={O.y} r={pr.sx} fill="none" stroke={C.muted} strokeWidth={1} strokeDasharray="3 3" />
      {arc(0.45, 0, az, C.sky)}
      {arc(0.7, az, az + aw, C.pink)}
      <Vec a={O} b={S(pr, z)} color={C.sky} w={2.4} />
      <Vec a={O} b={S(pr, w)} color={C.pink} w={2.4} />
      <Vec a={O} b={S(pr, p)} color={C.amber} w={3} />
      {dot(p, C.amber, "z·w")}
      {handles(true)}
    </>;
  } else if (mode === "powers") {
    const pts = powersOf(zp).slice(0, shown + 1);
    body = <>
      <Grid p={pr} step={0.5} labels={false} />{axisNames}
      <circle cx={O.x} cy={O.y} r={pr.sx} fill="none" stroke={C.muted} strokeWidth={1} strokeDasharray="3 3" />
      <polyline points={pts.map(q => `${pr.X(q.x).toFixed(1)},${pr.Y(q.y).toFixed(1)}`).join(" ")} fill="none" stroke={C.amber} strokeWidth={1.4} opacity={0.7} />
      {pts.map((q, k) => Math.abs(q.x) < 3 && Math.abs(q.y) < 1.6 && <g key={k}>
        <circle cx={pr.X(q.x)} cy={pr.Y(q.y)} r={k === 0 ? 4 : k === shown ? 5 : 3.5} fill={k === 0 ? C.fg : C.amber} />
        {k <= 6 && k !== 1 && <T x={pr.X(q.x) + 6} y={pr.Y(q.y) - 5} size={9.5} color={C.amber}>{k === 0 ? "1" : `z${sup(k)}`}</T>}
      </g>)}
      {handles(false, zp)}
    </>;
  } else {
    const roots = rootsOf(n), cur = rk % n;
    body = <>
      <Grid p={pr} step={0.5} labels={false} />
      <circle cx={pr.X(0)} cy={pr.Y(0)} r={pr.sx} fill="none" stroke={C.muted} strokeWidth={1.2} />
      <polygon points={roots.map(q => `${pr.X(q.x).toFixed(1)},${pr.Y(q.y).toFixed(1)}`).join(" ")} fill={C.amber} fillOpacity={0.1} stroke={C.amber} strokeWidth={1.4} />
      {roots.map((q, k) => <g key={k}>
        <line x1={pr.X(0)} y1={pr.Y(0)} x2={pr.X(q.x)} y2={pr.Y(q.y)} stroke={k === 1 ? C.pink : C.muted} strokeWidth={k === 1 ? 2 : 0.8} />
        <circle cx={pr.X(q.x)} cy={pr.Y(q.y)} r={5} fill={k === 0 ? C.fg : k === 1 ? C.pink : C.amber} />
        <T x={pr.X(q.x * 1.16)} y={pr.Y(q.y * 1.16) + 4} size={9.5} anchor="middle" color={k === 1 ? C.pink : C.muted}>{k === 0 ? "1" : k === 1 ? "ω" : `ω${sup(k)}`}</T>
      </g>)}
      {rk > 0 && <circle cx={pr.X(roots[cur].x)} cy={pr.Y(roots[cur].y)} r={10} fill="none" stroke={C.pink} strokeWidth={2.2} />}
    </>;
  }
  return <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{body}</svg>;
}

export function ComplexFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("multiply");
  const [z, setZ] = useState<Pt>({ x: 1.5, y: 0.5 });
  const [w, setW] = useState<Pt>({ x: 0.5, y: 1 });
  const [zp, setRawZp] = useState<Pt>({ x: 0.9, y: 0.4 });      // powers get their own z, near the unit circle
  const [n, setRawN] = useState(6);
  const [shown, setShown] = useState(MAXP);         // powers drawn: 1, z, …, z^shown
  const [rk, setRk] = useState(0);                  // roots: the power of ω being visited
  const [clock, setClock] = useState(0);
  const [playing, setPlaying] = useState(false);
  const lab = useLab("math-complex");
  const vis = useVisible<HTMLDivElement>();

  const animated = mode === "powers" || mode === "roots";
  const end = mode === "powers" ? MAXP : n;
  const pos = mode === "powers" ? shown : rk;
  const setPos = (v: number) => (mode === "powers" ? setShown(v) : setRk(v));
  useFrame(playing && animated && (vis.on || lab.open), dt => {
    const now = clock + dt;
    if (now < TICK) { setClock(now); return; }
    setClock(0);
    setPos(Math.min(end, pos + 1));
    if (pos + 1 >= end) setPlaying(false);
  });

  const stop = () => { setPlaying(false); setClock(0); };
  const goTo = (v: number) => { stop(); setPos(clamp(v, 0, end)); };
  const pick = (k: Mode) => { setMode(k); stop(); };
  const setZp = (v: Pt) => { setRawZp(v); setShown(MAXP); stop(); };
  const setN = (v: number) => { setRawN(v); setRk(0); stop(); };

  const st: Shared = { mode, z, w, zp, n, shown, rk };
  const p = cmul(z, w), s = { x: z.x + w.x, y: z.y + w.y };
  const az = deg(z), aw = deg(w);
  const pw = powersOf(zp), r = Math.hypot(zp.x, zp.y);
  const roots = rootsOf(n);

  const view = (
    <div>
      <CxStage st={st} setZ={setZ} setW={setW} setZp={setZp} t={t} />
      {animated && (
        <Transport t={t} playing={playing}
          onPlay={() => { if (!playing && pos >= end) setPos(0); setClock(0); setPlaying(q => !q); }}
          playLabel={mode === "powers" ? tx(t, "figCx_playP", "multiply by z again") : tx(t, "figCx_playR", "multiply by ω again")}
          onStep={() => goTo(pos + 1)}
          onBack={() => goTo(pos - 1)}
          onReset={() => goTo(0)}
          readout={mode === "powers"
            ? `z${sup(shown)} = ${cstr(pw[shown])}`
            : `ω${sup(rk)} = ${cstr(roots[rk % n])}`} />
      )}
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["add", tx(t, "figCx_mAdd", "add")],
    ["multiply", tx(t, "figCx_mMul", "multiply")],
    ["powers", tx(t, "figCx_mPow", "powers")],
    ["roots", tx(t, "figCx_mRoots", "roots of 1")],
  ] as const} />;
  const controls = mode === "add" ? <Row>
    <Readout color={C.sky}>{`z = ${cstr(z)}`}</Readout>
    <Readout color={C.pink}>{`w = ${cstr(w)}`}</Readout>
    <Readout color={C.amber}>{`z + w = (${n2(z.x)} + ${n2(w.x)}) + (${n2(z.y)} + ${n2(w.y)})i = ${cstr(s)}`}</Readout>
  </Row> : mode === "multiply" ? <>
    <Row>
      <Readout color={C.sky}>{`z = ${cstr(z)}  |z| = ${n2(Math.hypot(z.x, z.y))}  arg = ${Math.round(az)}°`}</Readout>
      <Readout color={C.pink}>{`w = ${cstr(w)}  |w| = ${n2(Math.hypot(w.x, w.y))}  arg = ${Math.round(aw)}°`}</Readout>
    </Row>
    <Row>
      <Readout color={C.amber}>{`z·w = (${n2(z.x)}·${n2(w.x)} − ${n2(z.y)}·${n2(w.y)}) + (${n2(z.x)}·${n2(w.y)} + ${n2(z.y)}·${n2(w.x)})i = ${cstr(p)}`}</Readout>
      <Readout color={C.amber}>{`|z·w| = ${n2(Math.hypot(p.x, p.y))} = |z|·|w|   arg = ${Math.round(deg(p))}°`}</Readout>
    </Row>
  </> : mode === "powers" ? <Row>
    <Readout color={C.sky}>{`z = ${cstr(zp)}`}</Readout>
    <Readout color={C.sky}>{`|z| = ${n2(r)}   arg z = ${Math.round(deg(zp))}°`}</Readout>
    <Readout color={C.amber}>{`z⁶ = ${cstr(pw[6])}  (|z|⁶ = ${n2(r ** 6)}, 6·arg = ${Math.round(6 * deg(zp))}°)`}</Readout>
  </Row> : <>
    <Slider label="n" value={n} min={2} max={9} step={1} onChange={setN} fmt={v => `${v}`} width="w-4" />
    <Row>
      <Readout color={C.pink}>{`ω = cos(360°/${n}) + i·sin(360°/${n}) = ${cstr(roots[1])}`}</Readout>
      <Readout>{`ω${sup(n)} = 1`}</Readout>
    </Row>
  </>;
  const note = {
    add: tx(t, "figCx_noteA", "Drag z and w. A complex number a + bi is the point (a, b): a steps along the real axis, b along the imaginary axis. Adding adds the real parts and the imaginary parts separately, which is exactly vector addition: walk along z, then along w (dashed), and you reach z + w."),
    multiply: tx(t, "figCx_noteM", "Drag z and w. The product's length is the two lengths multiplied, and its angle is the two angles added (blue arc, then pink arc). So multiplying by w is \"scale by |w| and turn by arg w\". Put w on the dashed unit circle and multiplication becomes a pure rotation; put w at i (0, 1) and every z turns a quarter turn, the (x, y) → (−y, x) rule."),
    powers: tx(t, "figCx_noteP2", "Drag z, and press play or ⏭ to add the next power. The dots are 1, z, z², z³, …: each is the previous one multiplied by z, so each step turns by the same angle and scales by the same factor |z|. Outside the unit circle the points spiral outward, inside they spiral in to 0, and exactly on it they walk round the circle forever. That is De Moivre's rule: zⁿ has length |z|ⁿ and angle n·arg z."),
    roots: tx(t, "figCx_noteR2", "The equation zⁿ = 1 has n complex solutions, the n-th roots of unity. They sit on the unit circle a 1/n turn apart and form a regular n-gon. The pink one, ω, turns by 360°/n; press play to multiply by ω again and again: its powers ω, ω², ω³, … visit every corner and ωⁿ is back at 1. For n = 2 the roots are 1 and −1; for n = 4 they are 1, i, −1 and −i."),
  }[mode];

  // ── Lab ──
  const onUnit = Math.abs(r - 1) < 0.01;
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figCxL1_t", "Adding is walking"),
      body: <>
        <p>{tx(t, "figCxL1_b1", "z = 1.5 + 0.5i stays put. Real parts add, imaginary parts add.")}</p>
        <p>{tx(t, "figCxL1_b2", "Drag w so that z + w = 3 + 2i.")}</p>
      </>,
      goal: { text: tx(t, "figCxL1_g", "z + w = 3 + 2i."), done: mode === "add" && near(s, { x: 3, y: 2 }, 0.03) },
      hint: tx(t, "figCxL1_h", "w = (3 − 1.5) + (2 − 0.5)i = 1.5 + 1.5i."),
      setup: () => { pick("add"); setZ({ x: 1.5, y: 0.5 }); setW({ x: -1, y: 1 }); },
    },
    {
      title: tx(t, "figCxL2_t", "Multiplying by i"),
      body: <>
        <p>{tx(t, "figCxL2_b1", "Multiplying adds the angles and multiplies the lengths.")}</p>
        <p>{tx(t, "figCxL2_b2", "Put w exactly at i and compare z·w with z.")}</p>
      </>,
      goal: { text: tx(t, "figCxL2_g", "w = i."), done: mode === "multiply" && near(w, { x: 0, y: 1 }, 0.03) },
      setup: () => { pick("multiply"); setZ({ x: 1.5, y: 0.5 }); setW({ x: 1, y: 0.5 }); },
    },
    {
      title: tx(t, "figCxL3_t", "Quick check"),
      body: <p>{tx(t, "figCxL3_b", "Multiply out the brackets, then use i² = −1.")}</p>,
      quiz: {
        q: tx(t, "figCxL3_q", "What is (1 + 2i)(3 − i)?"),
        options: ["5 + 5i", "3 − 2i", "1 + 5i", "5 + 7i"],
        answer: 0,
        why: tx(t, "figCxL3_w", "3 − i + 6i − 2i² = 3 + 5i − 2(−1) = 5 + 5i. 1 + 5i forgets that −2i² is +2."),
      },
    },
    {
      title: tx(t, "figCxL4_t", "Land on 2"),
      body: <>
        <p>{tx(t, "figCxL4_b1", "z = 1 + i is √2 long, 45° up. Choose w so that the product is exactly 2.")}</p>
        <p>{tx(t, "figCxL4_b2", "Think in lengths and angles: what must w add and multiply?")}</p>
      </>,
      goal: { text: tx(t, "figCxL4_g", "z·w = 2."), done: mode === "multiply" && near(p, { x: 2, y: 0 }, 0.05) },
      hint: tx(t, "figCxL4_h", "w must turn back by 45° and also be √2 long: w = 1 − i."),
      setup: () => { pick("multiply"); setZ({ x: 1, y: 1 }); setW({ x: 0.5, y: 1 }); },
    },
    {
      title: tx(t, "figCxL5_t", "Powers that close up"),
      body: <>
        <p>{tx(t, "figCxL5_b1", "z is on the unit circle at 60°. Each power turns another 60° and keeps the length 1.")}</p>
        <p>{tx(t, "figCxL5_b2", "Add the powers one at a time until you are back at 1.")}</p>
      </>,
      goal: { text: tx(t, "figCxL5_g", "Show up to z⁶."), done: mode === "powers" && shown >= 6 && onUnit },
      focus: "step",
      setup: () => { pick("powers"); setRawZp({ x: 0.5, y: Math.sqrt(3) / 2 }); setShown(0); },
    },
    {
      title: tx(t, "figCxL6_t", "Spiral"),
      body: <p>{tx(t, "figCxL6_b", "Drag z outside the unit circle and watch the powers.")}</p>,
      goal: { text: tx(t, "figCxL6_g", "|z| > 1.1."), done: mode === "powers" && r > 1.1 },
    },
    {
      title: tx(t, "figCxL7_t", "Quick check"),
      body: <p>{tx(t, "figCxL7_b", "|z| = 2 and arg z = 30°.")}</p>,
      quiz: {
        q: tx(t, "figCxL7_q", "What is z³?"),
        options: ["8i", "6i", "8", "2 + 90i"],
        answer: 0,
        why: tx(t, "figCxL7_w", "Length 2³ = 8, angle 3 · 30° = 90°: the point 8 up the imaginary axis, 8i. Lengths multiply (not 3 · 2 = 6), angles add."),
      },
    },
    {
      title: tx(t, "figCxL8_t", "Roots of 1"),
      body: <p>{tx(t, "figCxL8_b", "Choose n so that ω = i: a quarter turn.")}</p>,
      goal: { text: tx(t, "figCxL8_g", "n = 4."), done: mode === "roots" && n === 4 },
      setup: () => { pick("roots"); setN(6); },
    },
    {
      title: tx(t, "figCxL9_t", "Quick check"),
      body: <p>{tx(t, "figCxL9_b", "The n roots of 1 sit evenly round the circle.")}</p>,
      quiz: {
        q: tx(t, "figCxL9_q", "What do the 5 fifth roots of 1 add up to?"),
        options: ["0", "5", "1", "5i"],
        answer: 0,
        why: tx(t, "figCxL9_w", "Added as arrows they balance out: turning the whole set by 72° leaves it unchanged, so the sum must equal itself turned by 72°, and only 0 does that."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "rot", tone: "ok", when: mode === "multiply" && Math.abs(Math.hypot(w.x, w.y) - 1) < 0.02,
      title: tx(t, "figCxI1_t", "A pure turn"),
      body: fill(tx(t, "figCxI1_b", "|w| = 1, so multiplying by w only turns z, by {a}°. Its length stays {l}."), { a: Math.round(aw), l: n2(Math.hypot(z.x, z.y)) }),
    },
    {
      id: "real", tone: "info", when: mode === "multiply" && Math.abs(p.y) < 0.03 && Math.hypot(p.x, p.y) > 0.1,
      title: tx(t, "figCxI2_t", "A real product"),
      body: tx(t, "figCxI2_b", "The angles of z and w add up to a whole number of half turns, so z·w lands on the real axis."),
    },
    {
      id: "out", tone: "info", when: mode === "powers" && r > 1.01,
      title: tx(t, "figCxI3_t", "Spiralling out"),
      body: fill(tx(t, "figCxI3_b", "|z| = {r} > 1, so each power is {r} times further out: |z|⁶ = {r6}."), { r: n2(r), r6: n2(r ** 6) }),
    },
    {
      id: "in", tone: "info", when: mode === "powers" && r < 0.99,
      title: tx(t, "figCxI4_t", "Spiralling in"),
      body: fill(tx(t, "figCxI4_b", "|z| = {r} < 1, so the powers shrink towards 0 while they turn."), { r: n2(r) }),
    },
    {
      id: "closed", tone: "ok", when: mode === "powers" && onUnit && shown >= 6 && near(pw[6], { x: 1, y: 0 }, 0.02),
      title: tx(t, "figCxI5_t", "Back at 1"),
      body: tx(t, "figCxI5_b", "Six turns of 60° make a full turn and the length stays 1, so z⁶ = 1: z is a sixth root of unity."),
    },
    {
      id: "four", tone: "ok", when: mode === "roots" && n === 4,
      title: tx(t, "figCxI6_t", "1, i, −1, −i"),
      body: tx(t, "figCxI6_b", "The fourth roots of 1 are the quarter turns. ω = i and ω² = i² = −1: the square root of −1 is a quarter turn."),
    },
  ];

  const title = tx(t, "figCx_title", "The complex plane");
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
          tx(t, "figCxR1", "a + bi is the point (a, b); adding is adding arrows."),
          tx(t, "figCxR2", "Multiplying multiplies the lengths and adds the angles; |w| = 1 is a pure turn, and i is a quarter turn."),
          tx(t, "figCxR3", "zⁿ has length |z|ⁿ and angle n·arg z: spirals out, in, or round the circle."),
          tx(t, "figCxR4", "The n roots of 1 form a regular n-gon on the unit circle."),
        ]}
      />
    </>
  );
}
