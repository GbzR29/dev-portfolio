"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, Slider, Sliders, C, T, Handle, useDrag, useFrame, useVisible, nearest, f2, clamp } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// A bead on a track, released from rest. The track is a smooth curve through
// six draggable heights (Catmull–Rom); the release point is a seventh handle.
// The bars on the right split the energy: kinetic ½mv², potential mgh, and
// thermal (heat made by friction); their sum, the total, never changes.
// Without friction the bead swings for ever between two points at the release
// height (dashed line) whatever the shape in between. "break it: friction"
// (μ = 0.06) turns a little energy into heat on every metre, so the bead
// never gets back up and finally settles in a valley.
// The motion is integrated along the curve (a = −g sin θ − μ g cos θ, the
// centripetal part of the normal force is left out), and the speed is then
// taken from the energy bookkeeping, so the total stays exact.

const W = 560, H = 300;
const G = 9.81, MU = 0.06;
const XS = [0, 4, 8, 12, 16, 20];                     // control points, metres
const X0 = 22, Y0 = 268, S = 16;                      // origin (px) and px per metre
const BX = 400;                                       // energy bars start here

/** Catmull–Rom height and slope at x, through (XS, ys). */
function track(ys: number[], x: number) {
  const n = XS.length - 1, step = XS[1] - XS[0];
  const xc = clamp(x, 0, XS[n]);
  const i = Math.min(n - 1, Math.floor(xc / step)), u = (xc - XS[i]) / step;
  const p = (k: number) => ys[clamp(k, 0, n)];
  const p0 = p(i - 1), p1 = p(i), p2 = p(i + 1), p3 = p(i + 2);
  const m1 = (p2 - p0) / 2, m2 = (p3 - p1) / 2;      // tangents per segment
  const u2 = u * u, u3 = u2 * u;
  const y = (2 * u3 - 3 * u2 + 1) * p1 + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2 + (u3 - u2) * m2;
  const dy = ((6 * u2 - 6 * u) * p1 + (3 * u2 - 4 * u + 1) * m1 + (-6 * u2 + 6 * u) * p2 + (3 * u2 - 2 * u) * m2) / step;
  return { y, dy };
}

type State = { x: number; vs: number; heat: number };   // position (m), speed along the track (+ = right), heat per kg (J/kg)

export function EnergyTrackFigure({ t }: { t?: TrackTranslations }) {
  const [ys, setYs] = useState([10, 2, 5, 1, 4, 9]);
  const [x0, setX0] = useState(0.6);
  const [mass, setMass] = useState(20);
  const [fric, setFric] = useState(false);
  const [st, setSt] = useState<State>({ x: 0.6, vs: 0, heat: 0 });
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const vis = useVisible<HTMLDivElement>();
  const stuck = useRef(0);

  const h0 = track(ys, x0).y;
  const stop = () => setPlaying(false);
  const reset = (nx = x0) => { stop(); setSt({ x: nx, vs: 0, heat: 0 }); setTime(0); stuck.current = 0; };

  useFrame(playing && vis.on, dt => {
    // stop by itself once friction has brought the bead to rest
    stuck.current = fric && Math.abs(st.vs) < 0.02 ? stuck.current + dt : 0;
    if (stuck.current > 1.5) { setPlaying(false); return; }
    setTime(v => v + dt);
    setSt(s0 => {
      let { x, vs, heat } = s0;
      const n = 40, h = dt / n;
      for (let i = 0; i < n; i++) {
        const { dy } = track(ys, x);
        const k = Math.sqrt(1 + dy * dy), sin = dy / k, cos = 1 / k;
        let a = -G * sin;
        if (fric) {
          if (Math.abs(vs) < 1e-3 && Math.abs(G * sin) <= MU * G * cos) { vs = 0; continue; }   // static: it rests
          a -= Math.sign(vs || -sin) * MU * G * cos;
        }
        vs += a * h;
        const dx = (vs / k) * h;
        if (fric) heat += MU * G * cos * Math.abs(vs) * h;
        x += dx;
        if (x < 0) { x = -x; vs = -vs; }               // the ends are walls
        if (x > XS[XS.length - 1]) { x = 2 * XS[XS.length - 1] - x; vs = -vs; }
        // speed from the energy: ½v² = g(h0 − y) − heat
        const e = G * (h0 - track(ys, x).y) - heat;
        const sp = Math.sqrt(Math.max(0, 2 * e));
        vs = Math.sign(vs) * sp;
      }
      return { x, vs, heat };
    });
  });

  // ── drawing ──
  const X = (x: number) => X0 + x * S, Y = (y: number) => Y0 - y * S;
  const pathD = Array.from({ length: 201 }, (_, i) => {
    const x = (i / 200) * XS[XS.length - 1];
    return `${i ? "L" : "M"}${X(x).toFixed(1)},${Y(track(ys, x).y).toFixed(1)}`;
  }).join("");

  const here = track(ys, st.x);
  const k = Math.sqrt(1 + here.dy * here.dy);
  const bead = { x: X(st.x) - (here.dy / k) * 7, y: Y(here.y) - (1 / k) * 7 };
  const start = track(ys, x0);

  const drag = useDrag<number>(
    p => nearest(p, [[-1, { x: X(x0), y: Y(start.y) }], ...XS.map((x, i) => [i, { x: X(x), y: Y(ys[i]) }] as [number, { x: number; y: number }])], 16),
    (id, p) => {
      if (id === -1) { const nx = clamp((p.x - X0) / S, 0.05, XS[XS.length - 1] - 0.05); setX0(nx); reset(nx); }
      else { setYs(a => a.map((y, i) => (i === id ? clamp(Math.round(((Y0 - p.y) / S) * 4) / 4, 0, 13) : y))); reset(); }
    });

  // energies in joules
  const ke = 0.5 * mass * st.vs * st.vs;
  const pe = mass * G * here.y;
  const th = mass * st.heat;
  const tot = mass * G * h0;
  const EMAX = mass * G * 13;
  const bar = (i: number, val: number, color: string, label: string) => {
    const hpx = (val / EMAX) * 230, x = BX + i * 38;
    return <g key={label}>
      <rect x={x} y={Y0 - hpx} width={28} height={hpx} rx={2} fill={color} opacity={0.85} />
      <T x={x + 14} y={Y0 + 11 + (i % 2) * 11} anchor="middle" color={color} size={8.5}>{label}</T>
      <T x={x + 14} y={Y0 - hpx - 4} anchor="middle" color={color} size={7.5}>{f2(val / 1000, 2)}</T>
    </g>;
  };

  const view = (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {Array.from({ length: 14 }, (_, i) => i).filter(i => i % 2 === 0).map(i =>
        <g key={i}>
          <line x1={X0} x2={X(20)} y1={Y(i)} y2={Y(i)} stroke={C.grid} strokeWidth={0.6} />
          <T x={X0 - 4} y={Y(i) + 3} anchor="end" color={C.axis} size={8}>{i}</T>
        </g>)}
      <T x={X0 + 4} y={Y(13) - 4} color={C.axis} size={8}>h (m)</T>
      <path d={`${pathD} L${X(20)},${Y0} L${X0},${Y0} Z`} fill={C.axis} opacity={0.15} />
      <path d={pathD} fill="none" stroke={C.fg} strokeWidth={2} opacity={0.8} />
      <line x1={X0} x2={X(20)} y1={Y(h0)} y2={Y(h0)} stroke={C.amber} strokeDasharray="5 4" opacity={fric ? 0.35 : 0.8} />
      <T x={X(20)} y={Y(h0) - 4} anchor="end" color={C.amber} size={8.5}>{tx(t, "figPhEn_line", "release height")}</T>
      {XS.map((x, i) => <Handle key={i} x={X(x)} y={Y(ys[i])} color={C.muted} r={4} active={drag.dragging === i} />)}
      <Handle x={X(x0)} y={Y(start.y)} color={C.amber} r={4.5} active={drag.dragging === -1} />
      <circle cx={bead.x} cy={bead.y} r={7} fill={C.sky} stroke="var(--code-bg)" strokeWidth={1.5} />
      {/* energy bars */}
      <line x1={BX - 6} x2={W - 8} y1={Y0} y2={Y0} stroke={C.axis} />
      <line x1={BX - 6} x2={W - 8} y1={Y0 - (tot / EMAX) * 230} y2={Y0 - (tot / EMAX) * 230} stroke={C.purple} strokeDasharray="3 3" opacity={0.7} />
      {bar(0, ke, C.green, tx(t, "figPhEn_ke", "kinetic"))}
      {bar(1, pe, C.blue, tx(t, "figPhEn_pe", "potential"))}
      {bar(2, th, C.red, tx(t, "figPhEn_heat", "heat"))}
      {bar(3, ke + pe + th, C.purple, tx(t, "figPhEn_total", "total"))}
      <T x={BX - 6} y={20} color={C.muted} size={8.5}>{tx(t, "figPhEn_kj", "energy (kJ)")}</T>
    </svg>
  );

  return (
    <Figure title={tx(t, "figPhEn_title", "Energy on a track")}
      head={<Btn active={fric} onClick={() => { setFric(v => !v); reset(); }}>{tx(t, "figPhEn_fric", "break it: friction")}</Btn>}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figPhEn_mass", "mass m")} value={mass} min={1} max={80} step={1} onChange={setMass} fmt={v => `${v} kg`} />
        </Sliders>
        <Row>
          <Readout>{`h = ${f2(here.y, 2)} m`}</Readout>
          <Readout color={C.sky}>{`v = ${f2(Math.abs(st.vs), 2)} m/s`}</Readout>
          <Readout color={C.green}>{`½mv² = ${f2(ke, 0)} J`}</Readout>
          <Readout color={C.blue}>{`mgh = ${f2(pe, 0)} J`}</Readout>
          {fric && <Readout color={C.red}>{`${tx(t, "figPhEn_heat", "heat")} ${f2(th, 0)} J`}</Readout>}
          <Readout color={C.purple}>{`${tx(t, "figPhEn_total", "total")} ${f2(ke + pe + th, 0)} J`}</Readout>
        </Row>
      </>}
      note={tx(t, "figPhEn_note", "Drag the grey dots to reshape the track and the amber dot to choose where the bead starts, then press play. Watch the bars: as the bead goes down, blue potential energy turns into green kinetic energy, and back again on the way up; the purple total never moves. The bead turns round exactly on the dashed line, whatever the shape, and it can never cross a hill that pokes above that line. Change the mass: the energies scale, the motion does not. Then break it with friction: a red heat bar grows, the bead loses height on every swing, and the total, counting the heat, still stays the same.")}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing} onPlay={() => setPlaying(p => !p)}
          onReset={() => reset()}
          readout={`t = ${f2(time, 1)} s`} />
      </div>
    </Figure>
  );
}
