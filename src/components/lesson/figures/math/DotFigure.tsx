"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, C, T, Vec, Handle, plot, Grid, useDrag, nearest, f2, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// projection — a·b = |a||b|cos θ: the signed length of b's shadow on a, times
//              |a|. The background is split by the sign of x·a.
// facing     — a guard sees the player if the angle between its facing and the
//              direction to the player is within half its field of view:
//              f̂ · normalize(P − G) ≥ cos(fov / 2). No angles are computed.
// reflect    — a ray bouncing off a surface: r = d − 2(d·n̂)n̂. The dot product
//              splits d into the part along the normal (flipped) and the part
//              along the surface (kept).

type Mode = "proj" | "facing" | "reflect";
const dot = (a: Pt, b: Pt) => a.x * b.x + a.y * b.y;
const len = (a: Pt) => Math.hypot(a.x, a.y);
const nrm = (a: Pt) => { const l = len(a) || 1; return { x: a.x / l, y: a.y / l }; };

export function DotFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("proj");
  const [a, setA] = useState<Pt>({ x: 3, y: 0.8 });
  const [b, setB] = useState<Pt>({ x: 1.4, y: 2.2 });
  const [face, setFace] = useState<Pt>({ x: 1, y: 0.35 });
  const [player, setPlayer] = useState<Pt>({ x: 3.4, y: 1.6 });
  const [fov, setFov] = useState(70);
  const [src, setSrc] = useState<Pt>({ x: -3.5, y: 2.4 });
  const [tilt, setTilt] = useState(0);
  const p = plot({ W: 560, H: 300, x0: -5.6, x1: 5.6, y0: -3, y1: 3 });
  const S = (v: Pt) => ({ x: p.X(v.x), y: p.Y(v.y) });
  const O = S({ x: 0, y: 0 });

  const handleList: [string, Pt][] = mode === "proj" ? [["a", a], ["b", b]] : mode === "facing" ? [["f", { x: nrm(face).x * 1.6, y: nrm(face).y * 1.6 }], ["p", player]] : [["s", src]];
  const drag = useDrag<string>(q => nearest(q, handleList.map(([id, v]) => [id, S(v)] as [string, Pt]), 16), (id, q) => {
    const w = p.inv(q), v = { x: Math.max(-5.4, Math.min(5.4, w.x)), y: Math.max(-2.9, Math.min(2.9, w.y)) };
    if (id === "a") setA(v); else if (id === "b") setB(v); else if (id === "f") setFace(v); else if (id === "p") setPlayer(v); else setSrc({ x: v.x, y: Math.max(0.3, v.y) });
  });

  // projection
  const ab = dot(a, b), la = len(a), lb = len(b);
  const cos = ab / (la * lb || 1), theta = Math.acos(Math.max(-1, Math.min(1, cos)));
  const ah = nrm(a), projLen = ab / (la || 1), foot = { x: ah.x * projLen, y: ah.y * projLen };
  // facing
  const fh = nrm(face), toP = { x: player.x, y: player.y }, dP = nrm(toP);
  const fd = dot(fh, dP), limit = Math.cos((fov / 2) * Math.PI / 180), sees = fd >= limit;
  // reflect: surface through the origin, normal tilted by 'tilt'
  const n = { x: Math.sin(tilt), y: Math.cos(tilt) };
  const d = nrm({ x: -src.x, y: -src.y });                   // incoming direction: from src toward the origin
  const dn = dot(d, n);
  const rv = { x: d.x - 2 * dn * n.x, y: d.y - 2 * dn * n.y };
  const along = { x: d.x - dn * n.x, y: d.y - dn * n.y };

  // half-plane polygon for the sign regions (projection mode)
  const perp = { x: -ah.y, y: ah.x }, big = 20;
  const half = (s: number) => [
    { x: perp.x * big, y: perp.y * big }, { x: perp.x * big + ah.x * big * s, y: perp.y * big + ah.y * big * s },
    { x: -perp.x * big + ah.x * big * s, y: -perp.y * big + ah.y * big * s }, { x: -perp.x * big, y: -perp.y * big },
  ].map(S).map(q => `${q.x},${q.y}`).join(" ");
  const arc = (from: number, to: number, r: number, col: string) => {
    let dA = to - from; while (dA > Math.PI) dA -= 2 * Math.PI; while (dA < -Math.PI) dA += 2 * Math.PI;
    const p0 = S({ x: Math.cos(from) * r, y: Math.sin(from) * r }), p1 = S({ x: Math.cos(from + dA) * r, y: Math.sin(from + dA) * r });
    return <path d={`M${p0.x},${p0.y} A${r * p.sx},${r * p.sy} 0 0 ${dA > 0 ? 0 : 1} ${p1.x},${p1.y}`} fill="none" stroke={col} strokeWidth={2} />;
  };

  return (
    <Figure
      title={tx(t, "figDot_title", "The dot product at work")}
      head={<Choice value={mode} onChange={setMode} options={[["proj", tx(t, "figDot_proj", "projection")], ["facing", tx(t, "figDot_facing", "field of view")], ["reflect", tx(t, "figDot_reflect", "reflection")]] as const} />}
      controls={<>
        {mode === "facing" && <Slider label={tx(t, "figDot_fov", "field of view")} value={fov} min={10} max={300} step={1} onChange={setFov} fmt={v => `${v}°`} width="w-28" />}
        {mode === "reflect" && <Slider label={tx(t, "figDot_tilt", "surface tilt")} value={tilt} min={-0.8} max={0.8} step={0.01} onChange={setTilt} fmt={v => `${Math.round(v * 180 / Math.PI)}°`} width="w-28" />}
        <Row>
          {mode === "proj" && <>
            <Readout>a·b = aₓbₓ + a_yb_y = {f2(ab)}</Readout>
            <Readout>|a||b|cos θ = {f2(la)} × {f2(lb)} × {f2(cos, 3)}</Readout>
            <Readout color={C.purple}>θ = {(theta * 180 / Math.PI).toFixed(1)}°</Readout>
            <Readout color={C.green}>{tx(t, "figDot_shadow", "shadow of b on a")} = a·b / |a| = {f2(projLen)}</Readout>
          </>}
          {mode === "facing" && <>
            <Readout>f̂ · dir = {f2(fd, 3)}</Readout>
            <Readout>cos(fov/2) = {f2(limit, 3)}</Readout>
            <Readout color={sees ? C.green : C.red}>{sees ? tx(t, "figDot_sees", "seen") : tx(t, "figDot_hidden", "not seen")}</Readout>
          </>}
          {mode === "reflect" && <>
            <Readout>d·n̂ = {f2(dn, 3)}</Readout>
            <Readout color={C.amber}>r = d − 2(d·n̂)n̂ = ({f2(rv.x, 3)}, {f2(rv.y, 3)})</Readout>
          </>}
        </Row>
      </>}
      note={{
        proj: tx(t, "figDot_noteProj", "Drag a and b. Drop a perpendicular from b's tip onto the line of a: the green segment is b's shadow on a, and a·b is that shadow's signed length times |a|. The sign alone is already useful: positive when b points into a's half of the plane (green background), zero when they are perpendicular, negative when b points away. With unit vectors the dot product is just cos θ, a similarity score from −1 (opposite) to 1 (same direction)."),
        facing: tx(t, "figDot_noteFacing", "Drag the guard's facing handle and the player. The guard sees the player when the angle between its facing and the direction to the player is at most half the field of view. Instead of computing that angle with acos, compare cosines: both vectors are unit length, so their dot product is the cosine of the angle, and a larger cosine means a smaller angle. cos(fov/2) is a constant you compute once. Past 180° the cone wraps behind the guard and the limit becomes negative: it still works."),
        reflect: tx(t, "figDot_noteReflect", "Drag the light's source. The incoming direction d is split into two parts: (d·n̂)n̂ along the surface normal, and the rest along the surface. A mirror keeps the part along the surface and reverses the part along the normal. Subtracting the normal part twice (once to cancel it, once to reverse it) gives r = d − 2(d·n̂)n̂, which is exactly GLSL's reflect(). The same formula bounces balls and ricochets bullets."),
      }[mode]}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${p.W} ${p.H}`} className="w-full h-auto cursor-grab">
        {mode === "proj" && <>
          <polygon points={half(1)} fill={C.green} opacity={0.07} />
          <polygon points={half(-1)} fill={C.red} opacity={0.06} />
        </>}
        <Grid p={p} step={1} />
        {mode === "proj" && <>
          <line x1={S({ x: -ah.x * 8, y: -ah.y * 8 }).x} y1={S({ x: -ah.x * 8, y: -ah.y * 8 }).y} x2={S({ x: ah.x * 8, y: ah.y * 8 }).x} y2={S({ x: ah.x * 8, y: ah.y * 8 }).y} stroke={C.red} strokeOpacity={0.25} />
          <line x1={S(b).x} y1={S(b).y} x2={S(foot).x} y2={S(foot).y} stroke={C.muted} strokeDasharray="3 3" />
          <line x1={O.x} y1={O.y} x2={S(foot).x} y2={S(foot).y} stroke={C.green} strokeWidth={5} opacity={0.7} strokeLinecap="round" />
          {arc(Math.atan2(a.y, a.x), Math.atan2(b.y, b.x), 0.6, C.purple)}
          <Vec a={O} b={S(a)} color={C.red} />
          <Vec a={O} b={S(b)} color={C.sky} />
          <Handle x={S(a).x} y={S(a).y} color={C.red} r={4.5} />
          <Handle x={S(b).x} y={S(b).y} color={C.sky} r={4.5} />
          <T x={S(a).x + 8} y={S(a).y + 14} size={10} bold color={C.red}>a</T>
          <T x={S(b).x + 8} y={S(b).y - 6} size={10} bold color={C.sky}>b</T>
        </>}
        {mode === "facing" && (() => {
          const ang = Math.atan2(fh.y, fh.x), h = (fov / 2) * Math.PI / 180, R = 6;
          const e1 = S({ x: Math.cos(ang - h) * R, y: Math.sin(ang - h) * R }), e2 = S({ x: Math.cos(ang + h) * R, y: Math.sin(ang + h) * R });
          const fHandle = S({ x: fh.x * 1.6, y: fh.y * 1.6 });
          return <>
            <path d={`M${O.x},${O.y} L${e1.x},${e1.y} A${R * p.sx},${R * p.sy} 0 ${2 * h > Math.PI ? 1 : 0} 0 ${e2.x},${e2.y} Z`} fill={sees ? C.green : C.amber} opacity={0.12} />
            <line x1={O.x} y1={O.y} x2={S(player).x} y2={S(player).y} stroke={sees ? C.green : C.red} strokeDasharray="5 4" />
            <Vec a={O} b={fHandle} color={C.amber} w={3} />
            <circle cx={O.x} cy={O.y} r={10} fill={C.amber} />
            <circle cx={S(player).x} cy={S(player).y} r={9} fill={sees ? C.green : C.red} />
            <Handle x={fHandle.x} y={fHandle.y} color={C.amber} r={4} />
            <T x={O.x - 14} y={O.y + 24} size={10} bold color={C.amber}>G</T>
            <T x={S(player).x + 12} y={S(player).y + 4} size={10} bold color={sees ? C.green : C.red}>P</T>
          </>;
        })()}
        {mode === "reflect" && (() => {
          const tan = { x: n.y, y: -n.x };
          const s0 = S({ x: -tan.x * 7, y: -tan.y * 7 }), s1 = S({ x: tan.x * 7, y: tan.y * 7 });
          return <>
            <line x1={s0.x} y1={s0.y} x2={s1.x} y2={s1.y} stroke={C.fg} strokeWidth={3} />
            {Array.from({ length: 22 }, (_, i) => { const u = -6 + i * 0.6; const q0 = S({ x: tan.x * u, y: tan.y * u }), q1 = S({ x: tan.x * u - n.x * 0.25 - tan.x * 0.2, y: tan.y * u - n.y * 0.25 - tan.y * 0.2 }); return <line key={i} x1={q0.x} y1={q0.y} x2={q1.x} y2={q1.y} stroke={C.muted} opacity={0.6} />; })}
            <Vec a={O} b={S({ x: n.x * 1.6, y: n.y * 1.6 })} color={C.green} />
            <T x={S({ x: n.x * 1.7, y: n.y * 1.7 }).x + 4} y={S({ x: n.x * 1.7, y: n.y * 1.7 }).y} size={10} bold color={C.green}>n̂</T>
            <Vec a={S(src)} b={O} color={C.sky} w={2.4} />
            <Vec a={O} b={S({ x: rv.x * 3, y: rv.y * 3 })} color={C.amber} w={2.4} />
            {/* d split into its two parts, drawn along the incoming ray (scaled ×2.4) */}
            <Vec a={S({ x: -d.x * 2.4, y: -d.y * 2.4 })} b={S({ x: (along.x - d.x) * 2.4, y: (along.y - d.y) * 2.4 })} color={C.purple} dash="4 3" opacity={0.85} />
            <Vec a={S({ x: (along.x - d.x) * 2.4, y: (along.y - d.y) * 2.4 })} b={O} color={C.red} dash="4 3" opacity={0.85} />
            <Handle x={S(src).x} y={S(src).y} color={C.sky} r={5} />
            <T x={S(src).x + 8} y={S(src).y - 6} size={10} bold color={C.sky}>d</T>
            <T x={S({ x: rv.x * 3, y: rv.y * 3 }).x + 6} y={S({ x: rv.x * 3, y: rv.y * 3 }).y} size={10} bold color={C.amber}>r</T>
            <T x={8} y={p.H - 22} size={8.5} color={C.purple}>{tx(t, "figDot_along", "- - part along the surface (kept)")}</T>
            <T x={8} y={p.H - 9} size={8.5} color={C.red}>{tx(t, "figDot_normal", "- - part along the normal (reversed)")}</T>
          </>;
        })()}
      </svg>
    </Figure>
  );
}
