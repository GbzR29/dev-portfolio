"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, Slider, Sliders, C, T, Vec, useFrame, useVisible, f2, type Pt } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// A block on a slope, with an optional rope pulling it up the slope (tension
// T). Left: the scene. Right: the free-body diagram, with axes along and
// across the slope. The block holds while the static friction it needs,
// |mg sin θ − T|, is at most μs·N; past that it slides and kinetic friction
// μk·N takes over. Playing animates the slide. Options:
//   • split the weight — mg sin θ (along) and mg cos θ (across), dashed.
//   • break it: N = mg — the classic mistake. Across the slope the forces no
//     longer cancel: a red arrow shows the block being pushed off the surface.

const W = 560, H = 300;
const G = 9.81, L = 6;                                // slope length (m)
const X0 = 26, YB = 272, LPX = 290;                   // slope: left end, base line, length in px
const PXM = LPX / L;                                  // px per metre along the slope
const FX = 452, FY = 150;                             // free-body diagram centre

type Sim = { s: number; v: number };                  // distance down the slope from the top (m), velocity (+ = down)

export function InclineFigure({ t }: { t?: TrackTranslations }) {
  const [deg, setDeg] = useState(25);
  const [m, setM] = useState(5);
  const [mus, setMus] = useState(0.5);
  const [muk0, setMuk] = useState(0.35);
  const [T0, setT] = useState(0);
  const [split, setSplit] = useState(true);
  const [broken, setBroken] = useState(false);
  const [sim, setSim] = useState<Sim>({ s: L / 2, v: 0 });
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const vis = useVisible<HTMLDivElement>();

  const muk = Math.min(muk0, mus);                    // kinetic friction never exceeds static
  const th = (deg * Math.PI) / 180, sin = Math.sin(th), cos = Math.cos(th);
  const Wt = m * G;
  const N = broken ? Wt : Wt * cos;
  const D = Wt * sin - T0;                            // what pulls the block down the slope (+) or up (−)

  /** Friction (+ = down the slope) and the state it is in, for a given velocity. */
  const friction = (v: number) => {
    if (Math.abs(v) > 1e-6) return { f: -Math.sign(v) * muk * N, kind: "kinetic" as const };
    if (Math.abs(D) <= mus * N + 1e-9) return { f: -D, kind: "static" as const };
    return { f: -Math.sign(D) * muk * N, kind: "kinetic" as const };
  };
  const fr = friction(sim.v);
  const net = D + fr.f;
  const acc = net / m;
  const atEnd = sim.s <= 0 || sim.s >= L;

  useFrame(playing && vis.on, dt => {
    if (atEnd || (fr.kind === "static" && sim.v === 0)) { setPlaying(false); return; }
    setTime(x => x + dt);
    setSim(({ s, v }) => {
      const n = 20, h = dt / n;
      for (let i = 0; i < n; i++) {
        const { f } = friction(v);
        const nv = v + ((D + f) / m) * h;
        v = Math.sign(nv) !== Math.sign(v) && v !== 0 ? 0 : nv;   // friction stops the block, never reverses it
        s = Math.max(0, Math.min(L, s + v * h));
      }
      return { s, v };
    });
  });

  const stop = () => setPlaying(false);
  const reset = () => { stop(); setSim({ s: L / 2, v: 0 }); setTime(0); };
  const changed = (f: () => void) => { f(); reset(); };

  // ── geometry (SVG y points down) ──
  const u: Pt = { x: cos, y: sin };                   // down the slope
  const n: Pt = { x: sin, y: -cos };                  // out of the surface
  const top: Pt = { x: X0, y: YB - LPX * sin };
  const bottom: Pt = { x: X0 + LPX * cos, y: YB };
  const at = (s: number, off: number): Pt => ({ x: top.x + u.x * s * PXM + n.x * off, y: top.y + u.y * s * PXM + n.y * off });
  const bc = at(sim.s, 13);

  // ── forces in the free-body diagram ──
  const FPX = 82 / Math.max(Wt, T0);                 // px per newton: the largest force gets 82 px
  const arrow = (dir: Pt, mag: number) => ({ x: FX + dir.x * mag * FPX, y: FY + dir.y * mag * FPX });
  const o = { x: FX, y: FY };
  const perpNet = N - Wt * cos;                       // 0 unless N is wrong
  const status = broken && perpNet > 0.01
    ? tx(t, "figPhInc_leaves", "across the slope the forces don't cancel: the block would jump off")
    : atEnd ? tx(t, "figPhInc_end", "reached the end of the slope")
    : fr.kind === "static" && sim.v === 0 ? tx(t, "figPhInc_holds", "holds: static friction is enough")
    : (sim.v || D) > 0 ? tx(t, "figPhInc_down", "slides down") : tx(t, "figPhInc_up", "slides up");
  const thc = (Math.atan(mus) * 180) / Math.PI;

  const view = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* slope */}
      <path d={`M${top.x},${top.y} L${bottom.x},${bottom.y} L${X0},${YB} Z`} fill={C.axis} opacity={0.18} />
      <line x1={top.x} y1={top.y} x2={bottom.x} y2={bottom.y} stroke={C.axis} strokeWidth={2} />
      <line x1={X0} y1={YB} x2={bottom.x + 10} y2={YB} stroke={C.axis} strokeWidth={1.5} />
      {deg > 3 && <>
        <path d={`M${bottom.x - 40},${YB} A40,40 0 0 1 ${bottom.x - 40 * cos},${YB - 40 * sin}`} fill="none" stroke={C.amber} strokeWidth={1.2} />
        <T x={bottom.x - 48} y={YB - 6} anchor="end" color={C.amber}>{`${deg}°`}</T>
      </>}
      {/* rope and pulley */}
      {T0 > 0 && <>
        <circle cx={top.x - u.x * 10 + n.x * 13} cy={top.y - u.y * 10 + n.y * 13} r={6} fill="none" stroke={C.muted} strokeWidth={1.5} />
        <line x1={bc.x - u.x * 20} y1={bc.y - u.y * 20} x2={top.x - u.x * 10 + n.x * 13} y2={top.y - u.y * 10 + n.y * 13} stroke={C.purple} strokeWidth={1.6} />
      </>}
      {/* block */}
      <g transform={`translate(${bc.x},${bc.y}) rotate(${deg})`}>
        <rect x={-20} y={-13} width={40} height={26} rx={3} fill={C.sky} opacity={0.88} />
        <T x={0} y={4} anchor="middle" color="#fff" size={9} bold>{`${m} kg`}</T>
      </g>
      {Math.abs(net) > 0.05 && <Vec a={bc} b={{ x: bc.x + u.x * net * 1.4, y: bc.y + u.y * net * 1.4 }} color={C.amber} w={2.4} />}

      {/* free-body diagram */}
      <rect x={348} y={12} width={204} height={276} rx={10} fill="none" stroke={C.grid} />
      <T x={358} y={28} color={C.muted} size={8.5}>{tx(t, "figPhInc_fbd", "free-body diagram")}</T>
      <line x1={FX - u.x * 95} y1={FY - u.y * 95} x2={FX + u.x * 95} y2={FY + u.y * 95} stroke={C.grid} strokeDasharray="3 3" />
      <line x1={FX - n.x * 95} y1={FY - n.y * 95} x2={FX + n.x * 95} y2={FY + n.y * 95} stroke={C.grid} strokeDasharray="3 3" />
      {split && deg > 0 && <>
        <Vec a={o} b={arrow(u, Wt * sin)} color={C.blue} w={1.4} dash="4 3" />
        <Vec a={o} b={arrow({ x: -n.x, y: -n.y }, Wt * cos)} color={C.blue} w={1.4} dash="4 3" />
        <T x={arrow(u, Wt * sin).x + 4} y={arrow(u, Wt * sin).y + 12} color={C.blue} size={8}>mg sin θ</T>
        <T x={arrow({ x: -n.x, y: -n.y }, Wt * cos).x - 4} y={arrow({ x: -n.x, y: -n.y }, Wt * cos).y + 12} anchor="end" color={C.blue} size={8}>mg cos θ</T>
      </>}
      <Vec a={o} b={arrow({ x: 0, y: 1 }, Wt)} color={C.blue} w={2.2} />
      <T x={FX + 5} y={arrow({ x: 0, y: 1 }, Wt).y - 2} color={C.blue} size={9}>mg</T>
      <Vec a={o} b={arrow(n, N)} color={broken ? C.red : C.green} w={2.2} />
      <T x={arrow(n, N).x + 5} y={arrow(n, N).y} color={broken ? C.red : C.green} size={9}>N</T>
      {Math.abs(fr.f) > 0.01 && <>
        <Vec a={o} b={arrow(u, fr.f)} color={C.red} w={2.2} />
        <T x={arrow(u, fr.f).x} y={arrow(u, fr.f).y - 6} anchor="middle" color={C.red} size={9}>f</T>
      </>}
      {T0 > 0 && <>
        <Vec a={{ x: FX + n.x * 6, y: FY + n.y * 6 }} b={{ x: FX + n.x * 6 - u.x * T0 * FPX, y: FY + n.y * 6 - u.y * T0 * FPX }} color={C.purple} w={2.2} />
        <T x={FX + n.x * 14 - u.x * T0 * FPX} y={FY + n.y * 14 - u.y * T0 * FPX} anchor="middle" color={C.purple} size={9}>T</T>
      </>}
      {broken && perpNet > 0.01 && <>
        <Vec a={arrow(n, N)} b={arrow(n, N + perpNet * 4)} color={C.red} w={3} dash="2 2" />
        <T x={arrow(n, N + perpNet * 4).x + 6} y={arrow(n, N + perpNet * 4).y} color={C.red} size={8.5}>{tx(t, "figPhInc_extra", "unbalanced")}</T>
      </>}
      <circle cx={FX} cy={FY} r={3.5} fill={C.fg} />
    </svg>
  );

  return (
    <Figure title={tx(t, "figPhInc_title", "Block on a slope")}
      head={<>
        <Btn active={split} onClick={() => setSplit(v => !v)}>{tx(t, "figPhInc_split", "split the weight")}</Btn>
        <Btn active={broken} onClick={() => changed(() => setBroken(v => !v))}>{tx(t, "figPhInc_broken", "break it: N = mg")}</Btn>
      </>}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figPhInc_angle", "angle θ")} value={deg} min={0} max={60} step={1} onChange={v => changed(() => setDeg(v))} fmt={v => `${v}°`} />
          <Slider label={tx(t, "figPhInc_mass", "mass m")} value={m} min={1} max={10} step={0.5} onChange={v => changed(() => setM(v))} fmt={v => `${f2(v, 1)} kg`} />
          <Slider label="μs" value={mus} min={0} max={1} step={0.05} onChange={v => changed(() => setMus(v))} fmt={v => f2(v, 2)} />
          <Slider label="μk" value={muk0} min={0} max={1} step={0.05} onChange={v => changed(() => setMuk(v))} fmt={() => f2(muk, 2)} />
          <Slider label={tx(t, "figPhInc_rope", "rope T")} value={T0} min={0} max={100} step={1} onChange={v => changed(() => setT(v))} fmt={v => `${v} N`} />
        </Sliders>
        <Row>
          <Readout color={broken ? C.red : C.green}>{`N = ${f2(N, 1)} N`}</Readout>
          <Readout color={C.red}>{fr.kind === "static"
            ? `${tx(t, "figPhInc_static", "static")} f = ${f2(Math.abs(fr.f), 1)} ≤ μs·N = ${f2(mus * N, 1)} N`
            : `${tx(t, "figPhInc_kinetic", "kinetic")} f = μk·N = ${f2(Math.abs(fr.f), 1)} N`}</Readout>
          <Readout color={C.amber}>{`a = ${f2(Math.abs(acc), 2)} m/s²`}</Readout>
          <Readout>{`θc = arctan μs = ${f2(thc, 1)}°`}</Readout>
        </Row>
        <p className="text-[12px] font-semibold" style={{ color: broken ? C.red : C.fg }}>{status}</p>
      </>}
      note={tx(t, "figPhInc_note", "Raise the angle slowly with the rope at 0. The block holds, and the red friction arrow grows to match mg sin θ exactly: static friction gives only what is needed. At the critical angle θc = arctan μs it cannot give more, and the block starts to slide; press play to watch. Once it moves, friction drops to μk·N, which is why a stuck object, once it breaks free, suddenly speeds away. Pull with the rope and friction turns round to point down the slope when the rope wins. Notice that N is always mg cos θ, not mg: switch on the break-it button to see what goes wrong otherwise.")}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing} onPlay={() => { if (atEnd) reset(); setPlaying(p => !p); }}
          onReset={reset}
          readout={`t = ${f2(time, 1)} s · v = ${f2(Math.abs(sim.v), 2)} m/s`} />
      </div>
    </Figure>
  );
}
