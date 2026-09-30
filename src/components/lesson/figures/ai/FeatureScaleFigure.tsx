"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, C, T, Handle, useDrag, f2 } from "@/components/lesson/kit/figure";
import { APARTMENTS, meanStd } from "./data";

// ── What this figure shows ────────────────────────────────────────────────────
// Ten apartments as points in feature space (area, rooms), drawn with the
// SAME scale on both axes, so distances on screen are the distances an
// algorithm computes. Raw, area (tens of m²) dwarfs rooms (units) and the
// plot collapses into a thin strip; after min-max scaling or standardising,
// both features count. The draggable query apartment's nearest neighbour,
// the one a nearest-neighbour model would copy the price from, changes with
// the scaling.

type Mode = "raw" | "minmax" | "z";
const W = 620, H = 250, PAD = 26;
const areas = APARTMENTS.map(a => a.area as number), rooms = APARTMENTS.map(a => a.rooms as number);
const A = meanStd(areas), R = meanStd(rooms);
const AMIN = Math.min(...areas), AMAX = Math.max(...areas), RMIN = Math.min(...rooms), RMAX = Math.max(...rooms);

const scale = (m: Mode, area: number, room: number): [number, number] =>
  m === "raw" ? [area, room]
    : m === "minmax" ? [(area - AMIN) / (AMAX - AMIN), (room - RMIN) / (RMAX - RMIN)]
      : [(area - A.m) / A.sd, (room - R.m) / R.sd];
const unscale = (m: Mode, u: number, v: number): [number, number] =>
  m === "raw" ? [u, v]
    : m === "minmax" ? [AMIN + u * (AMAX - AMIN), RMIN + v * (RMAX - RMIN)]
      : [A.m + u * A.sd, R.m + v * R.sd];

// Equal-aspect view around the data in the current space
function view(m: Mode) {
  const pts = APARTMENTS.map(a => scale(m, a.area, a.rooms));
  const [ux0, ux1] = [Math.min(...pts.map(p => p[0])), Math.max(...pts.map(p => p[0]))];
  const [vy0, vy1] = [Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[1]))];
  const s = Math.min((W - 2 * PAD) / ((ux1 - ux0) * 1.1), (H - 2 * PAD) / ((vy1 - vy0) * 1.1));
  const cx = (ux0 + ux1) / 2, cy = (vy0 + vy1) / 2;
  return { X: (u: number) => W / 2 + (u - cx) * s, Y: (v: number) => H / 2 - (v - cy) * s, s, cx, cy };
}

export function FeatureScaleFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("raw");
  const [q, setQ] = useState<[number, number]>([70, 1]);          // query apartment, raw units
  const L = (k: string, en: string) => tx(t, `figAiScale_${k}`, en);

  const v = view(mode);
  const qs = scale(mode, q[0], q[1]);
  const dist = APARTMENTS.map(a => {
    const [u, w] = scale(mode, a.area, a.rooms);
    return { a, d: Math.hypot(u - qs[0], w - qs[1]) };
  }).sort((x, y) => x.d - y.d);
  const nn = dist[0];

  const drag = useDrag<"q">(
    p => (Math.hypot(p.x - v.X(qs[0]), p.y - v.Y(qs[1])) < 24 ? "q" : null),
    (_, p) => {
      const u = (p.x - W / 2) / v.s + v.cx, w = -(p.y - H / 2) / v.s + v.cy;
      const [area, room] = unscale(mode, u, w);
      setQ([Math.min(Math.max(area, 30), 125), Math.min(Math.max(room, 1), 4)]);
    },
  );

  return (
    <Figure
      title={L("title", "Feature scaling changes who is nearest")}
      head={<Choice value={mode} onChange={setMode} options={[["raw", L("raw", "raw")], ["minmax", "min-max"], ["z", L("z", "standardised (z)")]] as const} />}
      controls={<>
        <Row>
          <Readout color={C.amber}>{L("query", "query")}: {f2(q[0], 0)} m², {f2(q[1], 1)} {L("roomsU", "rooms")}</Readout>
          <Readout color={C.green}>{L("nearest", "nearest")}: {nn.a.id} ({nn.a.area} m², {nn.a.rooms} {L("roomsU", "rooms")}) → {nn.a.price}k</Readout>
        </Row>
        <Row>
          {dist.slice(0, 4).map(({ a, d }) => <Readout key={a.id}>d({a.id}) = {f2(d, mode === "raw" ? 1 : 2)}</Readout>)}
        </Row>
      </>}
      note={L("note", "Both axes use the same scale, so what you see is the distance the algorithm computes, √(Δarea² + Δrooms²). Raw, area spans 85 units and rooms only 3: the points lie on a flat strip and the nearest apartment is simply the one with the closest area, whatever its rooms. Min-max maps each feature to [0, 1]; standardising subtracts the mean and divides by the standard deviation. Either way both features weigh in, and for the query (70 m², 1 room) the nearest changes from E (3 rooms) to C (1 room). Drag the query to explore.")}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <line x1={PAD / 2} x2={W - PAD / 2} y1={v.Y(scale(mode, AMIN, RMIN)[1])} y2={v.Y(scale(mode, AMIN, RMIN)[1])} stroke={C.axis} strokeWidth={0.8} />
        <line x1={v.X(scale(mode, AMIN, RMIN)[0])} x2={v.X(scale(mode, AMIN, RMIN)[0])} y1={PAD / 2} y2={H - PAD / 2} stroke={C.axis} strokeWidth={0.8} />
        <T x={W - PAD} y={v.Y(scale(mode, AMIN, RMIN)[1]) + 13} size={8} anchor="end">{L("area", "area")} →</T>
        <T x={v.X(scale(mode, AMIN, RMIN)[0]) + 4} y={PAD / 2 + 8} size={8}>↑ {L("roomsU", "rooms")}</T>
        <line x1={v.X(qs[0])} y1={v.Y(qs[1])} x2={v.X(scale(mode, nn.a.area, nn.a.rooms)[0])} y2={v.Y(scale(mode, nn.a.area, nn.a.rooms)[1])} stroke={C.green} strokeWidth={1.6} strokeDasharray="4 3" />
        <circle cx={v.X(qs[0])} cy={v.Y(qs[1])} r={nn.d * v.s} fill={C.green} fillOpacity={0.05} stroke={C.green} strokeOpacity={0.5} />
        {APARTMENTS.map(a => {
          const [u, w] = scale(mode, a.area, a.rooms), isNN = a.id === nn.a.id;
          return (
            <g key={a.id}>
              <circle cx={v.X(u)} cy={v.Y(w)} r={isNN ? 6 : 4.5} fill={isNN ? C.green : C.sky} stroke="var(--code-bg)" strokeWidth={1.2} />
              <T x={v.X(u) + 6} y={v.Y(w) - 6} size={8.5} color={C.fg}>{a.id}</T>
            </g>
          );
        })}
        <Handle x={v.X(qs[0])} y={v.Y(qs[1])} color={C.amber} active={drag.dragging === "q"} />
      </svg>
    </Figure>
  );
}
