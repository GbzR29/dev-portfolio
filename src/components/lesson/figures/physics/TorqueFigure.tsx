"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, Vec, Handle, useDrag, useFrame, useVisible, nearest, f2, clamp, type Pt } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// Torque, the turning effect of a force, in two scenes.
//   • door — a door seen from above, hinged on the left. Drag the dot on the
//     door to choose where you push and the arrow tip to choose the force
//     (size and direction). Only the part of the force across the door (green)
//     turns it; the part along the door (red) just presses on the hinge. The
//     dashed line is the lever arm r⊥, the distance from the hinge to the line
//     of the force. Play swings the door with α = τ / I (I = M L²/3), with the
//     push turning along with the door; a negative torque meets the frame.
//   • seesaw — a 4 m plank on a central pivot with two children. Drag them
//     along the plank and set their masses; play releases the plank. It stays
//     level only when m_A g x_A + m_B g x_B = 0 (positions signed).
// Both motions are closed form or tiny exact integrations, so reset is exact.

const W = 560, H = 300;
const G = 9.81;
const DOOR_M = 15, DOOR_L = 0.9, DOOR_I = (DOOR_M * DOOR_L * DOOR_L) / 3;
const HX = 170, HY = 268, DS = 280, FPX = 4;          // hinge (px), px per metre, px per newton
const PL = 2, PX0 = 280, PY0 = 170, PS = 105;         // seesaw half length (m), pivot (px), px per metre
const PLANK_M = 20, TILT = 0.2;                       // plank mass (kg), largest tilt (rad) before it hits the ground

type Mode = "door" | "seesaw";

export function TorqueFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("door");
  const [s, setS] = useState(0.8);                     // where the push acts (m from the hinge)
  const [F, setF] = useState(30);                      // push (N)
  const [th, setTh] = useState(Math.PI / 2);           // angle between the door and the push
  const [mA, setMA] = useState(30);
  const [mB, setMB] = useState(20);
  const [xA, setXA] = useState(-1);
  const [xB, setXB] = useState(1.5);
  const [time, setTime] = useState(0);
  const [phi, setPhi] = useState({ a: 0, w: 0 });      // seesaw tilt and its rate
  const [playing, setPlaying] = useState(false);
  const vis = useVisible<HTMLDivElement>();

  const tau = s * F * Math.sin(th);
  const alpha = Math.max(0, tau) / DOOR_I;
  const doorEnd = alpha > 0 ? Math.sqrt(Math.PI / alpha) : 0;   // time to swing 90°
  const netSee = G * (mA * xA + mB * xB);                         // + turns the right side down

  useFrame(playing && vis.on, dt => {
    if (mode === "door") {
      if (alpha === 0 || time >= doorEnd) { setPlaying(false); return; }
      setTime(v => Math.min(doorEnd, v + dt));
    } else {
      setTime(v => v + dt);
      setPhi(p0 => {
        let { a, w } = p0;
        const n = 20, h = dt / n;
        for (let i = 0; i < n; i++) {
          const I = (PLANK_M * (2 * PL) ** 2) / 12 + mA * xA * xA + mB * xB * xB;
          w += ((netSee * Math.cos(a)) / I) * h;
          a += w * h;
          if (Math.abs(a) >= TILT) { a = Math.sign(a) * TILT; w = 0; }
        }
        if (Math.abs(a) >= TILT || netSee === 0) setPlaying(false);
        return { a, w };
      });
    }
  });

  const stop = () => setPlaying(false);
  const reset = () => { stop(); setTime(0); setPhi({ a: 0, w: 0 }); };
  const changed = (f: () => void) => { f(); reset(); };

  // ── door geometry ──
  const dphi = mode === "door" ? Math.min(Math.PI / 2, 0.5 * alpha * time * time) : 0;
  const d = { x: Math.cos(dphi), y: -Math.sin(dphi) };       // along the door (screen)
  const n = { x: -Math.sin(dphi), y: -Math.cos(dphi) };      // across it, the opening side
  const at = (r: number): Pt => ({ x: HX + r * DS * d.x, y: HY + r * DS * d.y });
  const base = at(s);
  const fv = { x: F * FPX * (Math.cos(th) * d.x + Math.sin(th) * n.x), y: F * FPX * (Math.cos(th) * d.y + Math.sin(th) * n.y) };
  const tip = { x: base.x + fv.x, y: base.y + fv.y };

  // ── seesaw geometry ──
  const pa = phi.a;
  const onPlank = (x: number, up = 0): Pt => ({ x: PX0 + x * PS * Math.cos(pa) + up * Math.sin(pa), y: PY0 + x * PS * Math.sin(pa) - up * Math.cos(pa) });

  const drag = useDrag<string>(
    p => mode === "door"
      ? nearest(p, [["tip", tip], ["base", base]], 18)
      : nearest(p, [["A", onPlank(xA, 22)], ["B", onPlank(xB, 22)]], 24),
    (id, p) => {
      if (id === "base") {
        const r = ((p.x - HX) * d.x + (p.y - HY) * d.y) / DS;
        changed(() => setS(clamp(Math.round(r * 20) / 20, 0.05, DOOR_L)));
      } else if (id === "tip") {
        const vx = p.x - base.x, vy = p.y - base.y;
        const along = vx * d.x + vy * d.y, across = vx * n.x + vy * n.y;
        changed(() => { setF(clamp(Math.round(Math.hypot(vx, vy) / FPX), 0, 50)); setTh(Math.atan2(across, along)); });
      } else {
        const x = clamp(Math.round((((p.x - PX0) * Math.cos(pa) + (p.y - PY0) * Math.sin(pa)) / PS) * 4) / 4, -PL, PL);
        changed(() => (id === "A" ? setXA(x) : setXB(x)));
      }
    });

  let view: React.ReactNode, controls: React.ReactNode;
  if (mode === "door") {
    const deg = (th * 180) / Math.PI;
    const fPerp = F * Math.sin(th), fPar = F * Math.cos(th);
    // foot of the perpendicular from the hinge to the line of the force
    const ux = fv.x / (Math.hypot(fv.x, fv.y) || 1), uy = fv.y / (Math.hypot(fv.x, fv.y) || 1);
    const k = (HX - base.x) * ux + (HY - base.y) * uy;
    const foot = { x: base.x + k * ux, y: base.y + k * uy };
    view = (
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <rect x={HX - 30} y={HY + 4} width={DOOR_L * DS + 60} height={8} fill={C.axis} opacity={0.5} />
        <T x={HX - 30} y={HY + 26} color={C.axis} size={8.5}>{tx(t, "figPhTor_wall", "wall (top view)")}</T>
        <path d={`M${HX + DOOR_L * DS},${HY} A${DOOR_L * DS},${DOOR_L * DS} 0 0 0 ${HX},${HY - DOOR_L * DS}`} fill="none" stroke={C.axis} strokeDasharray="3 4" opacity={0.6} />
        <line x1={HX} y1={HY} x2={at(DOOR_L).x} y2={at(DOOR_L).y} stroke={C.amber} strokeWidth={9} strokeLinecap="round" opacity={0.75} />
        <circle cx={HX} cy={HY} r={6} fill={C.fg} />
        <T x={HX - 8} y={HY - 10} anchor="end" color={C.fg} size={8.5}>{tx(t, "figPhTor_hinge", "hinge")}</T>
        {F > 0 && Math.abs(Math.sin(th)) > 0.02 && <>
          {/* the line of action, from the force to the foot of the perpendicular */}
          <line x1={base.x + ux * (Math.min(0, k) - 20)} y1={base.y + uy * (Math.min(0, k) - 20)}
            x2={base.x + ux * (Math.max(Math.hypot(fv.x, fv.y), k) + 20)} y2={base.y + uy * (Math.max(Math.hypot(fv.x, fv.y), k) + 20)}
            stroke={C.muted} strokeDasharray="2 4" opacity={0.5} />
          <line x1={HX} y1={HY} x2={foot.x} y2={foot.y} stroke={C.purple} strokeWidth={2} strokeDasharray="5 3" />
          <T x={(HX + foot.x) / 2 + 6} y={(HY + foot.y) / 2} color={C.purple} size={9}>r⊥</T>
        </>}
        <Vec a={base} b={{ x: base.x + fPar * FPX * d.x, y: base.y + fPar * FPX * d.y }} color={C.red} w={1.6} dash="4 3" opacity={0.8} />
        <Vec a={base} b={{ x: base.x + fPerp * FPX * n.x, y: base.y + fPerp * FPX * n.y }} color={C.green} w={1.6} dash="4 3" opacity={0.8} />
        <Vec a={base} b={tip} color={C.blue} w={2.6} />
        <Handle x={base.x} y={base.y} color={C.amber} active={drag.dragging === "base"} />
        <Handle x={tip.x} y={tip.y} color={C.blue} active={drag.dragging === "tip"} />
        <T x={W - 12} y={18} anchor="end" color={C.blue} size={9}>{`F = ${F} N, θ = ${f2(deg, 0)}°`}</T>
        <T x={W - 12} y={31} anchor="end" color={C.green} size={9}>{`${tx(t, "figPhTor_across", "across the door")} F sin θ = ${f2(fPerp, 1)} N`}</T>
        <T x={W - 12} y={44} anchor="end" color={C.red} size={9}>{`${tx(t, "figPhTor_along", "along the door")} F cos θ = ${f2(fPar, 1)} N`}</T>
        {tau < -0.01 && <T x={W - 12} y={57} anchor="end" color={C.red} size={9}>{tx(t, "figPhTor_frame", "it turns the door shut: the frame stops it")}</T>}
      </svg>
    );
    controls = <>
      <Sliders>
        <Slider label={tx(t, "figPhTor_where", "push at r")} value={s} min={0.05} max={DOOR_L} step={0.05} onChange={v => changed(() => setS(v))} fmt={v => `${f2(v, 2)} m`} />
        <Slider label={tx(t, "figPhTor_force", "force F")} value={F} min={0} max={50} step={1} onChange={v => changed(() => setF(v))} fmt={v => `${v} N`} />
      </Sliders>
      <Row>
        <Readout color={C.purple}>{`r⊥ = r sin θ = ${f2(s * Math.abs(Math.sin(th)), 2)} m`}</Readout>
        <Readout color={C.amber}>{`τ = r F sin θ = ${f2(tau, 1)} N·m`}</Readout>
        <Readout>{`I = ML²/3 = ${f2(DOOR_I, 2)} kg·m²`}</Readout>
        <Readout color={C.sky}>{`α = τ / I = ${f2(alpha, 2)} rad/s²`}</Readout>
      </Row>
    </>;
  } else {
    const end = (x: number) => onPlank(x);
    const kid = (x: number, m: number, color: string, label: string, id: string) => {
      const foot = onPlank(x, 4), head = onPlank(x, 16 + m * 0.5);
      const hp = onPlank(x, 22 + m * 0.5 + 6);
      return <g>
        <line x1={foot.x} y1={foot.y} x2={head.x} y2={head.y} stroke={color} strokeWidth={10} strokeLinecap="round" opacity={0.85} />
        <circle cx={hp.x} cy={hp.y} r={7} fill={color} />
        <Vec a={onPlank(x)} b={{ x: onPlank(x).x, y: onPlank(x).y + m * 1.3 }} color={C.red} w={1.8} opacity={0.75} />
        <T x={hp.x} y={hp.y - 12} anchor="middle" color={color} size={8.5}>{`${label} ${m} kg`}</T>
        <Handle x={onPlank(x, 22).x} y={onPlank(x, 22).y} color={color} r={4} active={drag.dragging === id} />
      </g>;
    };
    const ground = PY0 + PL * PS * Math.sin(TILT);
    view = (
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <line x1={0} x2={W} y1={ground + 4} y2={ground + 4} stroke={C.axis} strokeWidth={1.5} />
        <path d={`M${PX0},${PY0} L${PX0 - 16},${ground + 4} L${PX0 + 16},${ground + 4} Z`} fill={C.muted} opacity={0.6} />
        <line x1={end(-PL).x} y1={end(-PL).y} x2={end(PL).x} y2={end(PL).y} stroke={C.amber} strokeWidth={7} strokeLinecap="round" opacity={0.8} />
        {[-2, -1, 1, 2].map(x => <g key={x}>
          <circle cx={onPlank(x).x} cy={onPlank(x).y} r={1.6} fill={C.fg} />
          <T x={onPlank(x, -14).x} y={onPlank(x, -14).y + 3} anchor="middle" color={C.axis} size={8}>{`${x > 0 ? "+" : "−"}${Math.abs(x)} m`}</T>
        </g>)}
        {kid(xA, mA, C.sky, "A", "A")}
        {kid(xB, mB, C.pink, "B", "B")}
        <T x={12} y={18} color={C.sky} size={9}>{`τ_A = m_A g x_A = ${f2(G * mA * xA, 0)} N·m`}</T>
        <T x={12} y={31} color={C.pink} size={9}>{`τ_B = m_B g x_B = ${f2(G * mB * xB, 0)} N·m`}</T>
        <T x={12} y={44} color={Math.abs(netSee) < 1e-9 ? C.green : C.amber} size={9}>{Math.abs(netSee) < 1e-9
          ? tx(t, "figPhTor_balanced", "Στ = 0: balanced")
          : `Στ = ${f2(netSee, 0)} N·m → ${netSee > 0 ? tx(t, "figPhTor_rightDown", "right side goes down") : tx(t, "figPhTor_leftDown", "left side goes down")}`}</T>
      </svg>
    );
    controls = <Sliders>
      <Slider label={tx(t, "figPhTor_mA", "mass of A")} value={mA} min={10} max={60} step={5} onChange={v => changed(() => setMA(v))} fmt={v => `${v} kg`} />
      <Slider label={tx(t, "figPhTor_mB", "mass of B")} value={mB} min={10} max={60} step={5} onChange={v => changed(() => setMB(v))} fmt={v => `${v} kg`} />
    </Sliders>;
  }

  return (
    <Figure title={tx(t, "figPhTor_title", "The turning effect of a force")}
      head={<Choice value={mode} onChange={v => { setMode(v); reset(); }} options={[["door", tx(t, "figPhTor_door", "door")], ["seesaw", tx(t, "figPhTor_seesaw", "seesaw")]] as const} />}
      controls={controls}
      note={mode === "door"
        ? tx(t, "figPhTor_noteDoor", "Drag the amber dot to push nearer the hinge or the edge, and the blue tip to change the force. Push straight across the door at the edge and press play: it swings open. Now push at the same strength close to the hinge: the torque, and the swing, are much weaker. Turn the arrow until it points along the door: however hard you push, nothing turns, because the line of the force goes through the hinge and the lever arm (purple) is zero. The torque only cares about r⊥ times F.")
        : tx(t, "figPhTor_noteSee", "Drag the children along the plank and set their masses, then press play. At the start nothing happens: the 30 kg child 1 m from the pivot and the 20 kg child 1.5 m from it make torques of 294 N·m each, in opposite senses, so the heavier child does not win. Move B out to 2 m and B's side goes down; move A out and A's side does. The plank stays level only when m_A x_A + m_B x_B = 0, with positions counted negative on the left.")}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing} onPlay={() => { if (mode === "door" && time >= doorEnd) setTime(0); setPlaying(p => !p); }}
          onReset={reset}
          readout={mode === "door" ? `${f2((dphi * 180) / Math.PI, 0)}°` : `${f2((pa * 180) / Math.PI, 1)}°`} />
      </div>
    </Figure>
  );
}
