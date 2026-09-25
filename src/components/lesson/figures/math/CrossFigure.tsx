"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, Slider, Sliders, C, T, Vec } from "@/components/lesson/kit/figure";
import { type V3, cross, len, makeProjector, useOrbit, fmtV } from "@/components/lesson/kit/scene3d";

// ── What this figure shows ────────────────────────────────────────────────────
// a × b in 3D (y up, right-handed). a lies along x; b is set by its angle θ
// from a (around the vertical axis) and an elevation. The cross product is
// perpendicular to both, its length is the area of the parallelogram they
// span, |a||b|sin θ, and swapping the order flips it. Drag to orbit.

const W = 560, H = 320;

export function CrossFigure({ t }: { t?: TrackTranslations }) {
  const [theta, setTheta] = useState(70);
  const [elev, setElev] = useState(0);
  const [la, setLa] = useState(2.2);
  const [lb, setLb] = useState(1.8);
  const [swap, setSwap] = useState(false);
  const { orbit, handlers, ref, reset } = useOrbit({ yaw: -0.55, pitch: 0.42, zoom: 1 });
  const P = makeProjector(orbit, W / 2, H / 2 + 55, 46);

  const th = (theta * Math.PI) / 180, el = (elev * Math.PI) / 180;
  const a: V3 = [la, 0, 0];
  const b: V3 = [lb * Math.cos(th) * Math.cos(el), lb * Math.sin(el), -lb * Math.sin(th) * Math.cos(el)];
  const c = swap ? cross(b, a) : cross(a, b);
  const area = len(cross(a, b));
  const angle = Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (la * lb))));
  const O = P([0, 0, 0]);
  // Long results are drawn shortened so the arrow stays in view (the readout keeps the true value)
  const lc = len(c), shown = lc > 3.2 ? 3.2 / lc : 1;
  const pa = P(a), pb = P(b), pab = P([a[0] + b[0], a[1] + b[1], a[2] + b[2]]), pc = P([c[0] * shown, c[1] * shown, c[2] * shown]);
  // ground grid
  const grid: [V3, V3][] = [];
  for (let i = -3; i <= 3; i++) { grid.push([[i, 0, -3], [i, 0, 3]]); grid.push([[-3, 0, i], [3, 0, i]]); }

  return (
    <Figure
      title={tx(t, "figCross_title", "The cross product in 3D")}
      head={<>
        <Btn active={swap} onClick={() => setSwap(s => !s)}>{swap ? "b × a" : "a × b"}</Btn>
        <Btn onClick={reset}>{tx(t, "figCross_view", "reset view")}</Btn>
      </>}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figCross_theta", "angle a→b")} value={theta} min={0} max={180} step={1} onChange={setTheta} fmt={v => `${v}°`} />
          <Slider label={tx(t, "figCross_elev", "b elevation")} value={elev} min={-60} max={60} step={1} onChange={setElev} fmt={v => `${v}°`} />
          <Slider label="|a|" value={la} min={0.5} max={3} step={0.1} onChange={setLa} />
          <Slider label="|b|" value={lb} min={0.5} max={3} step={0.1} onChange={setLb} />
        </Sliders>
        <Row>
          <Readout color={C.red}>a = {fmtV(a)}</Readout>
          <Readout color={C.sky}>b = {fmtV(b)}</Readout>
          <Readout color={C.amber}>{swap ? "b × a" : "a × b"} = {fmtV(c)}</Readout>
          <Readout color={C.purple}>|a × b| = |a||b| sin θ = {area.toFixed(2)} ({tx(t, "figCross_angle", "θ")} = {(angle * 180 / Math.PI).toFixed(0)}°)</Readout>
        </Row>
      </>}
      note={tx(t, "figCross_note", "Drag to orbit the view. The amber arrow is perpendicular to both a and b, and its length equals the area of the purple parallelogram they span, |a||b| sin θ: largest at 90°, zero when a and b are parallel (0° or 180°), because a flat parallelogram has no area and there is no unique perpendicular direction. Its direction follows the right-hand rule: point your right hand's fingers along a, curl them toward b, and the thumb gives a × b. Swap the order: the arrow flips, because b × a = −(a × b). Tilt b up with the elevation slider: the result tilts too, always staying perpendicular to both.")}
    >
      <svg ref={ref} {...handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-grab" style={{ touchAction: "none" }}>
        {grid.map(([u, v], i) => { const p0 = P(u), p1 = P(v); return <line key={i} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={C.grid} />; })}
        {([[[3.4, 0, 0], "x", C.red], [[0, 3, 0], "y", C.green], [[0, 0, 3.4], "z", C.sky]] as [V3, string, string][]).map(([v, n, col]) => {
          const q = P(v);
          return <g key={n}><line x1={O.x} y1={O.y} x2={q.x} y2={q.y} stroke={col} strokeOpacity={0.35} /><T x={q.x + 4} y={q.y} size={9} color={col}>{n}</T></g>;
        })}
        <polygon points={[O, pa, pab, pb].map(q => `${q.x},${q.y}`).join(" ")} fill={C.purple} fillOpacity={0.18} stroke={C.purple} strokeOpacity={0.5} />
        <Vec a={O} b={pa} color={C.red} w={2.6} />
        <Vec a={O} b={pb} color={C.sky} w={2.6} />
        {len(c) > 0.02 && <Vec a={O} b={pc} color={C.amber} w={3} head={9} />}
        <T x={pa.x + 6} y={pa.y + 12} size={11} bold color={C.red}>a</T>
        <T x={pb.x + 6} y={pb.y - 4} size={11} bold color={C.sky}>b</T>
        {len(c) > 0.02 && <T x={pc.x + 6} y={pc.y} size={11} bold color={C.amber}>{`${swap ? "b × a" : "a × b"}${shown < 1 ? ` (${tx(t, "figCross_scaled", "drawn at")} ${Math.round(shown * 100)}%)` : ""}`}</T>}
      </svg>
    </Figure>
  );
}
