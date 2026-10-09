"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Btn, C, T, Handle, plot, Grid, useDrag, useFrame, useVisible, nearest, clamp, lerp, f2, type Plot, type Pt } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// match     — a triangle ABC (drag its corners) and a similar copy A'B'C'. The
//             Transport builds the copy in three moves: scale by k, turn by θ,
//             flip. Each corner keeps its colour, and each side has the colour
//             of the corner opposite it, so matching sides are found by
//             matching angles, never by position on the page.
// hourglass — two lines crossing at O between two parallels (the X or
//             "hourglass" shape): vertical angles at O and alternate angles at
//             the parallels make △OAB ∼ △OCD. Drag A, B and O.
// altitude  — a right triangle ACB (C on the semicircle over AB, so the angle
//             at C is 90°) and its altitude CD. The Transport lifts the three
//             triangles out and stacks them on their common angle α: three
//             sizes of one shape, so h/p = q/h = a/b, which gives h² = pq.
// The lab: build the copy, a side of the copy, the corner names, an hourglass
// with k = 2, a river width, pulling the right triangle apart, h² = pq.

type Mode = "match" | "hourglass" | "altitude";
type Id = "A" | "B" | "C" | "O" | "D";
type Tri = [Pt, Pt, Pt];
const W = 560, H = 300;
const pm = plot({ W, H, x0: 0, x1: 14.5, y0: 0, y1: 7.77 });
const pa = plot({ W, H, x0: 0, x1: 18, y0: 0, y1: 9.64 });
const COL = [C.green, C.blue, C.amber] as const;                 // corners A, B, C (and the sides opposite them)
const TARGET: Pt = { x: 10.2, y: 3.9 };                           // where the copy's centroid ends up
const YT = 7, YB = 1;                                              // the two parallels of the hourglass
const AB_Y = 1.5, AX = 0.5, BX = 8.5, R = (BX - AX) / 2, MX = (AX + BX) / 2;
const P0: Pt = { x: 9.6, y: 1.3 };                                 // the common corner of the stacked triangles

const n2 = (v: number) => (+v.toFixed(2)).toString();
const len = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const centroid = (t: Tri): Pt => ({ x: (t[0].x + t[1].x + t[2].x) / 3, y: (t[0].y + t[1].y + t[2].y) / 3 });
const area2 = (t: Tri) => Math.abs((t[1].x - t[0].x) * (t[2].y - t[0].y) - (t[2].x - t[0].x) * (t[1].y - t[0].y));
const pts = (t: Pt[], pl: Plot) => t.map(v => `${pl.X(v.x)},${pl.Y(v.y)}`).join(" ");
const lerpPt = (a: Pt, b: Pt, s: number): Pt => ({ x: lerp(a.x, b.x, s), y: lerp(a.y, b.y, s) });
const smooth = (s: number) => s * s * (3 - 2 * s);
/** The angle at V between the rays to P and Q, in degrees. */
const angleAt = (V: Pt, P: Pt, Q: Pt) => {
  const u = sub(P, V), w = sub(Q, V);
  return (Math.acos(clamp((u.x * w.x + u.y * w.y) / (Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y)), -1, 1)) * 180) / Math.PI;
};

/** A filled wedge marking the angle at V, between the rays to P and Q. */
function Wedge({ pl, V, P, Q, color, r = 18 }: { pl: Plot; V: Pt; P: Pt; Q: Pt; color: string; r?: number }) {
  const vx = pl.X(V.x), vy = pl.Y(V.y);
  const a1 = Math.atan2(pl.Y(P.y) - vy, pl.X(P.x) - vx), a2 = Math.atan2(pl.Y(Q.y) - vy, pl.X(Q.x) - vx);
  let d = a2 - a1;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  const s = `${vx + r * Math.cos(a1)},${vy + r * Math.sin(a1)}`, e = `${vx + r * Math.cos(a2)},${vy + r * Math.sin(a2)}`;
  return <path d={`M${vx},${vy}L${s}A${r},${r} 0 0 ${d > 0 ? 1 : 0} ${e}Z`} fill={color} fillOpacity={0.35} stroke={color} strokeWidth={1.2} />;
}

/** A triangle with coloured corners and sides (side i is opposite corner i), and its corner names. */
function ColouredTri({ pl, t, names }: { pl: Plot; t: Tri; names: string[] }) {
  const c = centroid(t);
  return <g>
    <polygon points={pts(t, pl)} fill={C.sky} fillOpacity={0.08} stroke="none" />
    {t.map((_, i) => <Wedge key={`w${i}`} pl={pl} V={t[i]} P={t[(i + 1) % 3]} Q={t[(i + 2) % 3]} color={COL[i]} r={area2(t) < 1 ? 10 : 18} />)}
    {t.map((_, i) => { const a = t[(i + 1) % 3], b = t[(i + 2) % 3];
      return <line key={`s${i}`} x1={pl.X(a.x)} y1={pl.Y(a.y)} x2={pl.X(b.x)} y2={pl.Y(b.y)} stroke={COL[i]} strokeWidth={2.6} strokeLinecap="round" />; })}
    {t.map((v, i) => { const dx = v.x - c.x, dy = v.y - c.y, m = Math.hypot(dx, dy) || 1;
      return <T key={`n${i}`} x={pl.X(v.x) + (14 * dx) / m} y={pl.Y(v.y) - (14 * dy) / m + 4} size={11} anchor="middle" color={COL[i]} bold>{names[i]}</T>; })}
  </g>;
}

// ── Poses ─────────────────────────────────────────────────────────────────────

/** The copy at animation time s: scale by k (and move), then turn by θ, then flip. */
function copyAt(t: Tri, k: number, theta: number, flip: boolean, s: number): Tri {
  const p1 = smooth(clamp(3 * s, 0, 1)), p2 = smooth(clamp(3 * s - 1, 0, 1)), p3 = smooth(clamp(3 * s - 2, 0, 1));
  const c0 = centroid(t), off = lerpPt(c0, TARGET, p1), kk = lerp(1, k, p1);
  const th = (theta * p2 * Math.PI) / 180, fl = flip ? 1 - 2 * p3 : 1;
  return t.map(v => {
    const x = fl * (v.x - c0.x) * kk, y = (v.y - c0.y) * kk;
    return { x: off.x + x * Math.cos(th) - y * Math.sin(th), y: off.y + x * Math.sin(th) + y * Math.cos(th) };
  }) as Tri;
}

/** The hourglass: C and D continue the lines AO and BO down to the lower parallel. */
function hourglass(A: Pt, B: Pt, O: Pt) {
  const k = (O.y - YB) / (YT - O.y);
  const Cp = { x: O.x + k * (O.x - A.x), y: YB }, Dp = { x: O.x + k * (O.x - B.x), y: YB };
  return { k, C: Cp, D: Dp };
}

/** The right triangle on the diameter AB, with the foot D of its altitude at x = dx. */
function rightTri(dx: number) {
  const A = { x: AX, y: AB_Y }, B = { x: BX, y: AB_Y }, D = { x: dx, y: AB_Y };
  const Cp = { x: dx, y: AB_Y + Math.sqrt(Math.max(0, R * R - (dx - MX) ** 2)) };
  const p = dx - AX, q = BX - dx, h = Cp.y - AB_Y, a = len(Cp, B), b = len(A, Cp);
  return { A, B, C: Cp, D, p, q, h, a, b, c: BX - AX };
}

/** Each triangle stacked on its angle α at P0: [α corner, right-angle corner, third corner]. */
function stacked(horizontal: number, vertical: number): Tri {
  return [P0, { x: P0.x + horizontal, y: P0.y }, { x: P0.x + horizontal, y: P0.y + vertical }];
}

// ── The drawing (owns its drag: it is mounted twice while the lab is open) ────

type StageProps = {
  mode: Mode; tri: Tri; setTri: (t: Tri) => void; k: number; theta: number; flip: boolean; s: number;
  hA: Pt; hB: Pt; hO: Pt; setH: (id: "A" | "B" | "O", v: Pt) => void; dx: number; setDx: (v: number) => void;
};

function SimTriStage({ mode, tri, setTri, k, theta, flip, s, hA, hB, hO, setH, dx, setDx }: StageProps) {
  const rt = rightTri(dx);
  const drag = useDrag<Id>(
    q => mode === "match"
      ? nearest(q, tri.map((v, i) => [(["A", "B", "C"] as const)[i], { x: pm.X(v.x), y: pm.Y(v.y) }]), 20)
      : mode === "hourglass"
        ? nearest(q, [["A", { x: pm.X(hA.x), y: pm.Y(hA.y) }], ["B", { x: pm.X(hB.x), y: pm.Y(hB.y) }], ["O", { x: pm.X(hO.x), y: pm.Y(hO.y) }]], 20)
        : s < 0.02 ? nearest(q, [["D", { x: pa.X(rt.C.x), y: pa.Y(rt.C.y) }]], 24) : null,
    (id, q) => {
      if (mode === "match") {
        const w = pm.inv(q), i = id === "A" ? 0 : id === "B" ? 1 : 2;
        const v = { x: clamp(Math.round(w.x * 2) / 2, 0.5, 5.5), y: clamp(Math.round(w.y * 2) / 2, 0.5, 7) };
        const next = tri.map((u, j) => (j === i ? v : u)) as Tri;
        if (area2(next) >= 1) setTri(next);
      } else if (mode === "hourglass") {
        const w = pm.inv(q);
        if (id === "O") setH("O", { x: clamp(Math.round(w.x * 2) / 2, 4, 10), y: clamp(Math.round(w.y * 2) / 2, 2.5, 5) });
        else if (id === "A") setH("A", { x: clamp(Math.round(w.x * 2) / 2, 1, hB.x - 1), y: YT });
        else setH("B", { x: clamp(Math.round(w.x * 2) / 2, hA.x + 1, 13.5), y: YT });
      } else {
        setDx(clamp(Math.round(pa.inv(q).x * 4) / 4, AX + 0.5, BX - 0.5));
      }
    });
  const cur = drag.dragging;

  if (mode === "match") {
    const cp = copyAt(tri, k, theta, flip, s);
    return (
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <Grid p={pm} step={1} labels={false} />
        <ColouredTri pl={pm} t={tri} names={["A", "B", "C"]} />
        {s >= 0.02 && <ColouredTri pl={pm} t={cp} names={["A'", "B'", "C'"]} />}
        {tri.map((v, i) => <Handle key={i} x={pm.X(v.x)} y={pm.Y(v.y)} color={COL[i]} active={cur === (["A", "B", "C"] as const)[i]} />)}
      </svg>
    );
  }

  if (mode === "hourglass") {
    const { C: Cp, D: Dp } = hourglass(hA, hB, hO);
    return (
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <Grid p={pm} step={1} labels={false} />
        {[YT, YB].map(y => <line key={y} x1={0} x2={W} y1={pm.Y(y)} y2={pm.Y(y)} stroke={C.muted} strokeWidth={1.2} strokeDasharray="6 4" />)}
        <polygon points={pts([hO, hA, hB], pm)} fill={C.sky} fillOpacity={0.18} stroke={C.sky} strokeWidth={2} strokeLinejoin="round" />
        <polygon points={pts([hO, Cp, Dp], pm)} fill={C.amber} fillOpacity={0.18} stroke={C.amber} strokeWidth={2} strokeLinejoin="round" />
        <Wedge pl={pm} V={hO} P={hA} Q={hB} color={C.green} />
        <Wedge pl={pm} V={hO} P={Cp} Q={Dp} color={C.green} />
        <Wedge pl={pm} V={hA} P={hB} Q={hO} color={C.blue} />
        <Wedge pl={pm} V={Cp} P={Dp} Q={hO} color={C.blue} />
        <Wedge pl={pm} V={hB} P={hA} Q={hO} color={C.pink} />
        <Wedge pl={pm} V={Dp} P={Cp} Q={hO} color={C.pink} />
        {([["A", hA, 0, -10], ["B", hB, 0, -10], ["O", hO, 14, 4], ["C", Cp, 0, 20], ["D", Dp, 0, 20]] as const).map(([n, v, ox, oy]) =>
          <T key={n} x={pm.X(v.x) + ox} y={pm.Y(v.y) + oy} size={11} anchor="middle" color={C.fg} bold>{n}</T>)}
        <T x={6} y={pm.Y(YT) - 6} size={9} color={C.muted}>{"AB ∥ DC"}</T>
        <Handle x={pm.X(hA.x)} y={pm.Y(hA.y)} color={C.sky} active={cur === "A"} />
        <Handle x={pm.X(hB.x)} y={pm.Y(hB.y)} color={C.sky} active={cur === "B"} />
        <Handle x={pm.X(hO.x)} y={pm.Y(hO.y)} color={C.green} active={cur === "O"} />
      </svg>
    );
  }

  // altitude: the three triangles in place (s = 0) or stacked on their angle α (s = 1)
  const e = smooth(s);
  const ACD = [rt.A, rt.D, rt.C].map((v, i) => lerpPt(v, stacked(rt.p, rt.h)[i], e));
  const CBD = [rt.C, rt.D, rt.B].map((v, i) => lerpPt(v, stacked(rt.h, rt.q)[i], e));
  const ACB = [rt.A, rt.C, rt.B].map((v, i) => lerpPt(v, stacked(rt.b, rt.a)[i], e));
  const legs: [number, number, string, string, string][] = [[rt.b, rt.a, "b", "a", C.amber], [rt.p, rt.h, "p", "h", C.sky], [rt.h, rt.q, "h", "q", C.pink]];
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <Grid p={pa} step={1} labels={false} />
      <path d={`M${pa.X(AX)},${pa.Y(AB_Y)}A${R * pa.sx},${R * pa.sx} 0 0 1 ${pa.X(BX)},${pa.Y(AB_Y)}`} fill="none" stroke={C.muted} strokeWidth={1} strokeDasharray="4 4" />
      {s > 0.02 && <polygon points={pts([rt.A, rt.C, rt.B], pa)} fill="none" stroke={C.muted} strokeWidth={1} strokeDasharray="4 3" />}
      <polygon points={pts(ACB, pa)} fill={C.amber} fillOpacity={0.12} stroke={C.amber} strokeWidth={2.2} strokeLinejoin="round" />
      <polygon points={pts(ACD, pa)} fill={C.sky} fillOpacity={0.3} stroke={C.sky} strokeWidth={1.8} strokeLinejoin="round" />
      <polygon points={pts(CBD, pa)} fill={C.pink} fillOpacity={0.3} stroke={C.pink} strokeWidth={1.8} strokeLinejoin="round" />
      {s < 0.02 ? <>
        {([["A", rt.A, -10, 4], ["B", rt.B, 10, 4], ["C", rt.C, 0, -10], ["D", rt.D, 0, 15]] as const).map(([n, v, ox, oy]) =>
          <T key={n} x={pa.X(v.x) + ox} y={pa.Y(v.y) + oy} size={11} anchor="middle" color={C.fg} bold>{n}</T>)}
        <T x={pa.X((AX + rt.D.x) / 2)} y={pa.Y(AB_Y) + 15} size={10} anchor="middle" color={C.sky} bold>{`p = ${n2(rt.p)}`}</T>
        <T x={pa.X((BX + rt.D.x) / 2)} y={pa.Y(AB_Y) + 15} size={10} anchor="middle" color={C.pink} bold>{`q = ${n2(rt.q)}`}</T>
        <T x={pa.X(rt.D.x) + 5} y={pa.Y(AB_Y + rt.h / 2)} size={10} color={C.fg} bold>{`h = ${n2(rt.h)}`}</T>
        <Handle x={pa.X(rt.C.x)} y={pa.Y(rt.C.y)} color={C.purple} active={cur === "D"} />
      </> : s > 0.98 && <>
        {legs.map(([hz, vt, hn, vn, col], i) => <g key={i}>
          <T x={pa.X(P0.x + hz) + 6} y={pa.Y(P0.y + vt / 2) + 4} size={10} color={col} bold>{vn}</T>
          <T x={pa.X(P0.x + hz)} y={pa.Y(P0.y) + 12 + 11 * i} size={10} anchor="middle" color={col} bold>{hn}</T>
        </g>)}
        <T x={pa.X(P0.x) + 22} y={pa.Y(P0.y) - 5} size={10} color={C.fg} bold>{"α"}</T>
      </>}
    </svg>
  );
}

export function SimilarTrianglesFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setModeRaw] = useState<Mode>("match");
  const [tri, setTri] = useState<Tri>([{ x: 1, y: 1.5 }, { x: 5, y: 1.5 }, { x: 2, y: 5 }]);
  const [k, setK] = useState(1.25);
  const [theta, setTheta] = useState(90);
  const [flip, setFlip] = useState(true);
  const [hA, setHA] = useState<Pt>({ x: 3, y: YT });
  const [hB, setHB] = useState<Pt>({ x: 7, y: YT });
  const [hO, setHO] = useState<Pt>({ x: 6, y: 5 });
  const [dx, setDx] = useState(3);
  const [s, setS] = useState(1);
  const [dir, setDir] = useState(1);
  const [playing, setPlaying] = useState(false);
  const lab = useLab("math-similar-triangles");
  const vis = useVisible<HTMLDivElement>();

  const setMode = (m: Mode) => { setPlaying(false); setModeRaw(m); setS(m === "match" ? 1 : 0); };
  const setH = (id: "A" | "B" | "O", v: Pt) => (id === "A" ? setHA(v) : id === "B" ? setHB(v) : setHO(v));

  useFrame(playing && (vis.on || lab.open), dt => {
    const next = clamp(s + dir * dt * (mode === "match" ? 0.33 : 0.6), 0, 1);
    setS(next);
    if (next <= 0 || next >= 1) setPlaying(false);
  });
  // ⏭ / ⏮: the three moves of the copy, or apart / together for the right triangle.
  const stops = mode === "match" ? [0, 1 / 3, 2 / 3, 1] : [0, 1];
  const step = (d: 1 | -1) => {
    setPlaying(false);
    setS(d > 0 ? stops.find(v => v > s + 1e-6) ?? 1 : [...stops].reverse().find(v => v < s - 1e-6) ?? 0);
  };
  const play = () => {
    if (playing) { setPlaying(false); return; }
    if (mode === "match") { if (s >= 1) setS(0); setDir(1); }
    else setDir(s >= 1 ? -1 : 1);
    setPlaying(true);
  };

  const cp = copyAt(tri, k, theta, flip, s);
  const sides = [0, 1, 2].map(i => [len(tri[(i + 1) % 3], tri[(i + 2) % 3]), len(cp[(i + 1) % 3], cp[(i + 2) % 3])]);
  const angles = [0, 1, 2].map(i => angleAt(tri[i], tri[(i + 1) % 3], tri[(i + 2) % 3]));
  const hg = hourglass(hA, hB, hO);
  const rt = rightTri(dx);
  const phase = s < 1e-6 ? tx(t, "figSimT_phStart", "the original") : s < 1 / 3 + 1e-6 ? tx(t, "figSimT_ph0", "1. scale by k") : s < 2 / 3 + 1e-6 ? tx(t, "figSimT_ph1", "2. turn by θ") : s < 1 - 1e-6 ? tx(t, "figSimT_ph2", "3. flip") : tx(t, "figSimT_ph3", "the copy");

  const view = (
    <div>
      <SimTriStage mode={mode} tri={tri} setTri={setTri} k={k} theta={theta} flip={flip} s={s}
        hA={hA} hB={hB} hO={hO} setH={setH} dx={dx} setDx={setDx} />
      {mode !== "hourglass" && <Transport t={t} playing={playing} onPlay={play}
        playLabel={mode === "match" ? tx(t, "figSimT_build", "build the copy") : tx(t, "figSimT_pull", "pull the triangles apart")}
        onStep={() => step(1)} onBack={() => step(-1)} onReset={() => { setPlaying(false); setS(0); }}
        readout={mode === "match" ? phase : s >= 1 ? tx(t, "figSimT_apart", "stacked on α") : s <= 0 ? tx(t, "figSimT_together", "in place") : "…"} />}
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={setMode} options={[
    ["match", tx(t, "figSimT_mMatch", "matching corners")],
    ["hourglass", tx(t, "figSimT_mHour", "hourglass")],
    ["altitude", tx(t, "figSimT_mAlt", "right-triangle altitude")],
  ] as const} />;

  const controls = mode === "match" ? <>
    <Slider label={tx(t, "figSimT_k", "scale factor k")} value={k} min={0.5} max={1.5} step={0.05} onChange={setK} fmt={n2} width="w-28" />
    <Slider label={tx(t, "figSimT_theta", "turn θ")} value={theta} min={0} max={345} step={15} onChange={setTheta} fmt={v => `${v}°`} width="w-28" />
    <Row><Btn active={flip} onClick={() => setFlip(v => !v)}>{tx(t, "figSimT_flip", "flip (mirror image)")}</Btn></Row>
    <Row>
      {sides.map(([o, c], i) => <Readout key={i} color={COL[i]}>{`${["B'C'/BC", "C'A'/CA", "A'B'/AB"][i]} = ${n2(c)}/${n2(o)} = ${n2(c / o)}`}</Readout>)}
    </Row>
    <Row>
      <Readout>{`∠A = ∠A' = ${f2(angles[0], 0)}°  ∠B = ∠B' = ${f2(angles[1], 0)}°  ∠C = ∠C' = ${f2(angles[2], 0)}°`}</Readout>
    </Row>
  </> : mode === "hourglass" ? <Row>
    <Readout>{`OC/OA = ${n2(len(hO, hg.C))}/${n2(len(hO, hA))} = ${n2(hg.k)}`}</Readout>
    <Readout>{`OD/OB = ${n2(len(hO, hg.D))}/${n2(len(hO, hB))} = ${n2(hg.k)}`}</Readout>
    <Readout color={C.amber}>{`DC/AB = ${n2(len(hg.C, hg.D))}/${n2(len(hA, hB))} = ${n2(hg.k)}`}</Readout>
  </Row> : <>
    <Row>
      <Readout color={C.sky}>{`p = ${n2(rt.p)}`}</Readout>
      <Readout color={C.pink}>{`q = ${n2(rt.q)}`}</Readout>
      <Readout>{`h = ${n2(rt.h)}`}</Readout>
      <Readout color={C.amber}>{`a = ${n2(rt.a)}  b = ${n2(rt.b)}  c = ${n2(rt.c)}`}</Readout>
    </Row>
    <Row>
      <Readout>{`h/p = q/h = a/b = ${n2(rt.h / rt.p)}`}</Readout>
      <Readout color={C.green}>{`h² = ${n2(rt.h * rt.h)} = p·q = ${n2(rt.p * rt.q)}`}</Readout>
    </Row>
  </>;
  const note = mode === "match"
    ? tx(t, "figSimT_noteM", "Each corner keeps its colour in the copy, and each side has the colour of the corner opposite it. Press ▶ to watch the copy being made: scaled by k, turned by θ, then flipped. However it ends up on the page, the green side of the copy matches the green side of the original, and every coloured ratio is k. Drag A, B and C to try other shapes.")
    : mode === "hourglass"
      ? tx(t, "figSimT_noteH", "The two dashed lines are parallel, and the lines AC and BD cross at O. The green angles at O are vertical angles, so they are equal; the blue angles at A and C are alternate angles between the parallels, and so are the pink ones. By AA the two triangles are similar, with C matching A and D matching B. Drag O up and down: the ratio k is how much taller the lower triangle is than the upper one.")
      : tx(t, "figSimT_noteA", "C sits on the semicircle over AB, so the angle at C is a right angle (Thales). The altitude CD splits the triangle into two smaller right triangles. Press ▶ to stack all three on their shared angle α: they are three sizes of one shape, so the legs are in the same ratio h/p = q/h = a/b. Drag C along the semicircle.");

  // ── Lab ──
  const near = (a: number, b: number, e = 1e-6) => Math.abs(a - b) < e;
  const isStart = tri[0].x === 1 && tri[0].y === 1.5 && tri[1].x === 5 && tri[1].y === 1.5 && tri[2].x === 2 && tri[2].y === 5;
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figSimTL1_t", "Build a copy"),
      body: <>
        <p>{tx(t, "figSimTL1_b1", "A similar copy is the same triangle scaled, turned and possibly flipped. Step through the three moves with ⏭.")}</p>
        <p>{tx(t, "figSimTL1_b2", "Watch the colours: each corner keeps its colour, and each side has the colour of the corner opposite it.")}</p>
      </>,
      goal: { text: tx(t, "figSimTL1_g", "Finish the copy."), done: mode === "match" && s >= 1 },
      focus: "step",
      setup: () => { setModeRaw("match"); setPlaying(false); setS(0); setTri([{ x: 1, y: 1.5 }, { x: 5, y: 1.5 }, { x: 2, y: 5 }]); setK(1.25); setTheta(90); setFlip(true); },
    },
    {
      title: tx(t, "figSimTL2_t", "A side of the copy"),
      body: <>
        <p>{tx(t, "figSimTL2_b1", "In the original, AB = 4. Every side of the copy is k times its partner.")}</p>
        <p>{tx(t, "figSimTL2_b2", "Choose k so that A'B' = 6.")}</p>
      </>,
      goal: { text: fill(tx(t, "figSimTL2_g", "A'B' = 6 (now {v})."), { v: n2(sides[2][1]) }), done: mode === "match" && s >= 1 && isStart && near(k, 1.5) },
      hint: tx(t, "figSimTL2_h", "k = A'B'/AB = 6/4 = 1.5. The other two sides then grow by the same factor."),
      setup: () => { setModeRaw("match"); setPlaying(false); setS(1); setTri([{ x: 1, y: 1.5 }, { x: 5, y: 1.5 }, { x: 2, y: 5 }]); setK(1); setTheta(90); setFlip(true); },
    },
    {
      title: tx(t, "figSimTL3_t", "Quick check"),
      body: <p>{tx(t, "figSimTL3_b", "Two triangles ABC and DEF have ∠A = ∠D and ∠B = ∠F.")}</p>,
      quiz: {
        q: tx(t, "figSimTL3_q", "Which side of DEF matches BC?"),
        options: ["EF", "DE", "DF"],
        answer: 0,
        why: tx(t, "figSimTL3_w", "The corners pair up as A ↔ D, B ↔ F and so C ↔ E (the third angles are equal too). BC joins B and C, so it matches the side joining F and E. Written in matching order, △ABC ∼ △DFE."),
      },
    },
    {
      title: tx(t, "figSimTL4_t", "The hourglass"),
      body: <>
        <p>{tx(t, "figSimTL4_b1", "Two lines cross at O between two parallel lines. The upper and lower triangles have equal angles, so they are similar.")}</p>
        <p>{tx(t, "figSimTL4_b2", "Drag O until the lower triangle is exactly twice the upper one.")}</p>
      </>,
      goal: { text: fill(tx(t, "figSimTL4_g", "k = 2 (now {k})."), { k: n2(hg.k) }), done: mode === "hourglass" && near(hg.k, 2) },
      hint: tx(t, "figSimTL4_h", "The heights of the two triangles are in the ratio k. The parallels are 6 apart, so the upper triangle needs height 2 and the lower one 4: O at height 5."),
      setup: () => { setModeRaw("hourglass"); setPlaying(false); setHA({ x: 3, y: YT }); setHB({ x: 7, y: YT }); setHO({ x: 6, y: 4 }); },
    },
    {
      title: tx(t, "figSimTL5_t", "Quick check"),
      body: <p>{tx(t, "figSimTL5_b", "An hourglass: AB ∥ DC, and the lines AC and BD cross at O. OA = 4, OC = 10 and AB = 6.")}</p>,
      quiz: {
        q: tx(t, "figSimTL5_q", "How long is DC?"),
        options: ["15", "12", "2.4", "24"],
        answer: 0,
        why: tx(t, "figSimTL5_w", "k = OC/OA = 10/4 = 2.5, and DC matches AB, so DC = 2.5 · 6 = 15. 2.4 comes from dividing the wrong way round."),
      },
    },
    {
      title: tx(t, "figSimTL6_t", "Three triangles in one"),
      body: <>
        <p>{tx(t, "figSimTL6_b1", "The altitude CD of a right triangle cuts it into two smaller right triangles.")}</p>
        <p>{tx(t, "figSimTL6_b2", "Press ▶ to lift them out and stack them on their common angle α.")}</p>
      </>,
      goal: { text: tx(t, "figSimTL6_g", "Stack the three triangles."), done: mode === "altitude" && s >= 1 },
      focus: "play",
      setup: () => { setModeRaw("altitude"); setPlaying(false); setS(0); setDx(3); },
    },
    {
      title: tx(t, "figSimTL7_t", "h² = p · q"),
      body: <>
        <p>{tx(t, "figSimTL7_b1", "Stacked, the triangles show h/p = q/h. Multiply both sides by p·h and you get h² = p·q: the altitude is the geometric mean of the two pieces of the hypotenuse.")}</p>
        <p>{tx(t, "figSimTL7_b2", "Drag C until p = 2, then check h² against p·q.")}</p>
      </>,
      goal: { text: fill(tx(t, "figSimTL7_g", "p = 2 (now p = {p}, h² = {h2})."), { p: n2(rt.p), h2: n2(rt.h * rt.h) }), done: mode === "altitude" && s <= 0 && near(rt.p, 2) },
      hint: tx(t, "figSimTL7_h", "q = 8 − 2 = 6, so h² = 2 · 6 = 12 and h = √12 ≈ 3.46."),
      setup: () => { setModeRaw("altitude"); setPlaying(false); setS(0); setDx(4.5); },
    },
    {
      title: tx(t, "figSimTL8_t", "Quick check"),
      body: <p>{tx(t, "figSimTL8_b", "The altitude of a right triangle splits the hypotenuse into pieces of 9 and 16.")}</p>,
      quiz: {
        q: tx(t, "figSimTL8_q", "How long is the altitude?"),
        options: ["12", "12.5", "25", "144"],
        answer: 0,
        why: tx(t, "figSimTL8_w", "h² = p · q = 9 · 16 = 144, so h = 12. The legs follow the same way: a² = 16 · 25 = 400 and b² = 9 · 25 = 225, so the triangle is 15, 20, 25."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "mirror", tone: "info", when: mode === "match" && flip && s >= 1,
      title: tx(t, "figSimTI1_t", "A mirror image is still similar"),
      body: tx(t, "figSimTI1_b", "The flipped copy runs its corners the other way round, so pairing sides by position on the page fails. Pair them by colour: the side opposite the green angle matches the side opposite the green angle."),
    },
    {
      id: "congruent", tone: "info", when: mode === "match" && near(k, 1) && s >= 1,
      title: tx(t, "figSimTI2_t", "k = 1: congruent"),
      body: tx(t, "figSimTI2_b", "With k = 1 the copy is the same size: turned and flipped, but congruent. Congruence is similarity with k = 1."),
    },
    {
      id: "hourEqual", tone: "info", when: mode === "hourglass" && near(hg.k, 1),
      title: tx(t, "figSimTI3_t", "O halfway: congruent triangles"),
      body: tx(t, "figSimTI3_b", "With O halfway between the parallels the two triangles are congruent: AB = DC, and O is the midpoint of both crossing segments."),
    },
    {
      id: "isosceles", tone: "ok", when: mode === "altitude" && near(rt.p, rt.q),
      title: tx(t, "figSimTI4_t", "The top of the semicircle"),
      body: tx(t, "figSimTI4_b", "p = q, so h² = p², h = p: the altitude is the radius, and the two halves are mirror images, each with angles 45°, 45°, 90°."),
    },
    {
      id: "pyth", tone: "ok", when: mode === "altitude" && s >= 1,
      title: tx(t, "figSimTI5_t", "Pythagoras for free"),
      body: fill(tx(t, "figSimTI5_b", "The same stacking gives a² = q·c and b² = p·c. Add them: a² + b² = (p + q)·c = c². Here {a2} + {b2} = {c2}."), { a2: n2(rt.a * rt.a), b2: n2(rt.b * rt.b), c2: n2(rt.c * rt.c) }),
    },
  ];

  const title = tx(t, "figSimT_title", "Similar triangles");
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
          tx(t, "figSimTR1", "A similar copy is the original scaled, turned and possibly flipped: angles stay, every side is multiplied by k."),
          tx(t, "figSimTR2", "Match sides through the angles opposite them, not through their position on the page."),
          tx(t, "figSimTR3", "Two lines crossing between parallels make an hourglass of two similar triangles."),
          tx(t, "figSimTR4", "The altitude to the hypotenuse makes three similar right triangles: h² = pq, a² = qc, b² = pc, and so a² + b² = c²."),
        ]}
      />
    </>
  );
}
