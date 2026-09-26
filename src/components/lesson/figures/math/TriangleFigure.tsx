"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, Handle, plot, Grid, useDrag, nearest, clamp, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// classify   — drag the three corners of a triangle on a grid. Each corner's
//              angle is drawn and measured, the sides are measured, and the
//              triangle is named by its sides and by its angles. Top right,
//              the three angles are copied side by side onto a straight line:
//              they always fill it exactly, 180°.
// inequality — choose three side lengths. Side c lies flat; the arcs are
//              every point at distance b from its left end and at distance a
//              from its right end. The third corner must be on both arcs, so
//              the triangle exists only when they cross: when each side is
//              shorter than the other two together.

type Mode = "classify" | "inequality";
type Id = "A" | "B" | "C";
const COL: Record<Id, string> = { A: C.sky, B: C.pink, C: C.amber };
const deg = (r: number) => (r * 180) / Math.PI;
const n1 = (v: number) => (+v.toFixed(1)).toString();

/** Interior angle at p between the directions to q and s, in degrees. */
function angleAt(p: Pt, q: Pt, s: Pt) {
  const a = Math.atan2(q.y - p.y, q.x - p.x), b = Math.atan2(s.y - p.y, s.x - p.x);
  let d = Math.abs(a - b);
  if (d > Math.PI) d = 2 * Math.PI - d;
  return deg(d);
}

/** Wedge (in viewBox units) at p towards q and s, radius r. */
function wedge(p: Pt, q: Pt, s: Pt, r: number) {
  const a = Math.atan2(q.y - p.y, q.x - p.x), b = Math.atan2(s.y - p.y, s.x - p.x);
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  const e = { x: p.x + r * Math.cos(b), y: p.y + r * Math.sin(b) };
  return `M${p.x},${p.y} L${p.x + r * Math.cos(a)},${p.y + r * Math.sin(a)} A${r},${r} 0 0 ${d > 0 ? 1 : 0} ${e.x},${e.y} Z`;
}

export function TriangleFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("classify");
  const [pts, setPts] = useState<Record<Id, Pt>>({ A: { x: -5, y: -2.5 }, B: { x: 4, y: -2.5 }, C: { x: -1, y: 3 } });
  const [sa, setSa] = useState(5), [sb, setSb] = useState(4), [sc, setSc] = useState(6);
  const p = plot({ W: 560, H: 300, x0: -7, x1: 7, y0: -3.75, y1: 3.75 });
  const V = (q: Pt) => ({ x: p.X(q.x), y: p.Y(q.y) });

  const drag = useDrag<Id>(
    q => mode === "classify" ? nearest(q, (["A", "B", "C"] as Id[]).map(k => [k, V(pts[k])] as [Id, Pt]), 20) : null,
    (id, q) => {
      const w = p.inv(q);
      const s = { x: clamp(Math.round(w.x * 2) / 2, -6.5, 6.5), y: clamp(Math.round(w.y * 2) / 2, -3.5, 3.5) };
      setPts(o => (Object.keys(o) as Id[]).some(k => k !== id && o[k].x === s.x && o[k].y === s.y) ? o : { ...o, [id]: s });
    });

  let svg: React.ReactNode, controls: React.ReactNode, note: string;

  if (mode === "classify") {
    const S = { A: V(pts.A), B: V(pts.B), C: V(pts.C) };
    const ang = { A: angleAt(S.A, S.B, S.C), B: angleAt(S.B, S.C, S.A), C: angleAt(S.C, S.A, S.B) };
    const len = (u: Pt, v: Pt) => Math.hypot(u.x - v.x, u.y - v.y);
    // Side a is opposite corner A, and so on
    const side = { a: len(pts.B, pts.C), b: len(pts.C, pts.A), c: len(pts.A, pts.B) };
    const area2 = Math.abs((pts.B.x - pts.A.x) * (pts.C.y - pts.A.y) - (pts.C.x - pts.A.x) * (pts.B.y - pts.A.y));
    const flat = area2 < 1e-9;
    const rounded = (Object.keys(ang) as Id[]).map(k => Math.round(ang[k]));
    const same = (x: number, y: number) => Math.abs(x - y) < 1e-6;
    const eq = [same(side.a, side.b), same(side.b, side.c), same(side.c, side.a)].filter(Boolean).length;
    const bySides = eq === 3 ? tx(t, "figTri_equi", "equilateral") : eq >= 1 ? tx(t, "figTri_iso", "isosceles") : tx(t, "figTri_scal", "scalene");
    const big = Math.max(ang.A, ang.B, ang.C);
    const byAngles = Math.abs(big - 90) < 0.05 ? tx(t, "figTri_rightT", "right") : big > 90 ? tx(t, "figTri_obtuseT", "obtuse") : tx(t, "figTri_acuteT", "acute");

    // The three angles laid side by side on a line, top right
    const L = { x: 470, y: 62 }, rr = 38;
    let start = 0;
    const fan = (["A", "B", "C"] as Id[]).map(k => {
      const a0 = start, a1 = start + ang[k]; start = a1;
      const e0 = { x: L.x + rr * Math.cos((a0 * Math.PI) / 180), y: L.y - rr * Math.sin((a0 * Math.PI) / 180) };
      const e1 = { x: L.x + rr * Math.cos((a1 * Math.PI) / 180), y: L.y - rr * Math.sin((a1 * Math.PI) / 180) };
      return <path key={k} d={`M${L.x},${L.y} L${e0.x},${e0.y} A${rr},${rr} 0 0 0 ${e1.x},${e1.y} Z`} fill={COL[k]} fillOpacity={0.45} stroke={COL[k]} />;
    });

    svg = <>
      <Grid p={p} step={1} labels={false} />
      <rect x={L.x - rr - 10} y={L.y - rr - 14} width={2 * rr + 20} height={rr + 30} rx={6} fill="var(--surface)" stroke={C.grid} />
      {!flat && fan}
      <line x1={L.x - rr - 4} y1={L.y} x2={L.x + rr + 4} y2={L.y} stroke={C.fg} strokeWidth={1.6} />
      <T x={L.x} y={L.y + 12} size={8.5} anchor="middle" color={C.fg}>{`A + B + C = 180°`}</T>
      {!flat && (["A", "B", "C"] as Id[]).map(k => {
        const [q, s] = k === "A" ? [S.B, S.C] : k === "B" ? [S.C, S.A] : [S.A, S.B];
        return <path key={k} d={wedge(S[k], q, s, 22)} fill={COL[k]} fillOpacity={0.3} stroke={COL[k]} />;
      })}
      <polygon points={`${S.A.x},${S.A.y} ${S.B.x},${S.B.y} ${S.C.x},${S.C.y}`} fill={C.fg} fillOpacity={0.05} stroke={C.fg} strokeWidth={2} strokeLinejoin="round" />
      {(["a", "b", "c"] as const).map(k => {
        const [u, v] = k === "a" ? [S.B, S.C] : k === "b" ? [S.C, S.A] : [S.A, S.B];
        return <T key={k} x={(u.x + v.x) / 2 + 6} y={(u.y + v.y) / 2 - 6} size={9.5} color={C.fg}>{`${k} = ${n1(side[k])}`}</T>;
      })}
      {(["A", "B", "C"] as Id[]).map(k => <g key={k}>
        <T x={S[k].x + (S[k].x < 280 ? -30 : 12)} y={S[k].y + (S[k].y < 150 ? -10 : 18)} size={10} color={COL[k]} bold>{`${k} ${Math.round(ang[k])}°`}</T>
        <Handle {...S[k]} color={COL[k]} active={drag.dragging === k} />
      </g>)}
    </>;
    controls = <>
      <Row>
        {(["A", "B", "C"] as Id[]).map((k, i) => <Readout key={k} color={COL[k]}>{`${k} ≈ ${rounded[i]}°`}</Readout>)}
        <Readout>{`${rounded.join("° + ")}° ≈ 180°`}</Readout>
      </Row>
      <Row>
        {flat
          ? <Readout color={C.red}>{tx(t, "figTri_flat", "the corners are collinear: no triangle")}</Readout>
          : <>
            <Readout color={C.green}>{`${tx(t, "figTri_bySides", "by sides:")} ${bySides}`}</Readout>
            <Readout color={C.green}>{`${tx(t, "figTri_byAngles", "by angles:")} ${byAngles}`}</Readout>
          </>}
      </Row>
    </>;
    note = tx(t, "figTri_noteC", "Drag the corners A, B and C. Side a is opposite corner A, b opposite B, c opposite C. However you shape the triangle, its three angles laid side by side (top right) exactly fill a straight line, 180°. Try the named shapes: two equal sides (isosceles) also give two equal angles; a 90° corner makes a right triangle; one corner above 90° makes it obtuse. Line the three corners up and the triangle collapses.");
  } else {
    const q = plot({ W: 560, H: 300, x0: -1.5, x1: 12.5, y0: -2.5, y1: 5 });
    const A = { x: 0, y: 0 }, B = { x: sc, y: 0 };
    const ok = sa + sb > sc && sa + sc > sb && sb + sc > sa;
    const flat = !ok && (Math.abs(sa + sb - sc) < 1e-9 || Math.abs(sa + sc - sb) < 1e-9 || Math.abs(sb + sc - sa) < 1e-9);
    const cx = (sb * sb - sa * sa + sc * sc) / (2 * sc), cy = Math.sqrt(Math.max(0, sb * sb - cx * cx));
    const P = (u: Pt) => ({ x: q.X(u.x), y: q.Y(u.y) });
    const Cp = P({ x: cx, y: cy });
    const arc = (c: Pt, rad: number) => <circle cx={q.X(c.x)} cy={q.Y(c.y)} r={rad * q.sx} fill="none" strokeDasharray="4 4" />;
    const checks = [[sa, sb, sc, "a + b", "c"], [sb, sc, sa, "b + c", "a"], [sa, sc, sb, "a + c", "b"]] as const;
    svg = <>
      <Grid p={q} step={1} labels={false} />
      <g stroke={C.sky}>{arc(A, sb)}</g>
      <g stroke={C.pink}>{arc(B, sa)}</g>
      {(ok || flat) && <polygon points={`${q.X(0)},${q.Y(0)} ${q.X(sc)},${q.Y(0)} ${Cp.x},${Cp.y}`} fill={C.green} fillOpacity={0.12} stroke={C.green} strokeWidth={2} />}
      {(ok || flat) && <><line x1={q.X(0)} y1={q.Y(0)} x2={Cp.x} y2={Cp.y} stroke={C.sky} strokeWidth={3} /><line x1={q.X(sc)} y1={q.Y(0)} x2={Cp.x} y2={Cp.y} stroke={C.pink} strokeWidth={3} /></>}
      {!ok && !flat && <>
        <line x1={q.X(0)} y1={q.Y(0)} x2={q.X(0) + sb * q.sx * 0.8} y2={q.Y(0) - sb * q.sx * 0.6} stroke={C.sky} strokeWidth={3} />
        <line x1={q.X(sc)} y1={q.Y(0)} x2={q.X(sc) - sa * q.sx * 0.8} y2={q.Y(0) - sa * q.sx * 0.6} stroke={C.pink} strokeWidth={3} />
      </>}
      <line x1={q.X(0)} y1={q.Y(0)} x2={q.X(sc)} y2={q.Y(0)} stroke={C.amber} strokeWidth={3} />
      <T x={q.X(sc / 2)} y={q.Y(0) + 16} size={10} anchor="middle" color={C.amber} bold>{`c = ${sc}`}</T>
      {(ok || flat) && <circle cx={Cp.x} cy={Cp.y} r={5} fill={C.green} />}
      <T x={q.X(0) - 6} y={q.Y(0) + 4} size={9} anchor="end" color={C.fg}>A</T>
      <T x={q.X(sc) + 6} y={q.Y(0) + 4} size={9} color={C.fg}>B</T>
    </>;
    controls = <>
      <Sliders>
        <Slider label={tx(t, "figTri_sa", "side a (from B)")} value={sa} min={1} max={10} step={0.5} onChange={setSa} fmt={n1} width="w-28" />
        <Slider label={tx(t, "figTri_sb", "side b (from A)")} value={sb} min={1} max={10} step={0.5} onChange={setSb} fmt={n1} width="w-28" />
        <Slider label={tx(t, "figTri_sc", "side c (base)")} value={sc} min={1} max={10} step={0.5} onChange={setSc} fmt={n1} width="w-28" />
      </Sliders>
      <Row>
        {checks.map(([x, y, z, l, r]) => <Readout key={l} color={x + y > z ? C.green : C.red}>{`${l} = ${n1(x + y)} ${x + y > z ? ">" : x + y === z ? "=" : "<"} ${r} = ${n1(z)}`}</Readout>)}
        <Readout color={ok ? C.green : flat ? C.amber : C.red}>{ok ? tx(t, "figTri_ok", "a triangle exists") : flat ? tx(t, "figTri_degen", "flat: the corners are on one line") : tx(t, "figTri_no", "the sides cannot meet")}</Readout>
      </Row>
    </>;
    note = tx(t, "figTri_noteI", "Choose three lengths. The blue arc is every point at distance b from A, the pink arc every point at distance a from B; the third corner has to be on both. When one side is at least as long as the other two together, the arcs never cross (or only touch on the base line) and no triangle can be built. The rule is the triangle inequality: every side must be shorter than the sum of the other two.");
  }

  return (
    <Figure
      title={tx(t, "figTri_title", "Triangles")}
      head={<Choice value={mode} onChange={setMode} options={[["classify", tx(t, "figTri_mClass", "angles & names")], ["inequality", tx(t, "figTri_mIneq", "can it close?")]] as const} />}
      controls={controls}
      note={note}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox="0 0 560 300" className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
