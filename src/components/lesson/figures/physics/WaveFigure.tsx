"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Readout, Row, Slider, Sliders, C, T, useFrame, useVisible, f2 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// A string 4 m long with linear density μ = 0.1 kg/m, so its wave speed is
// v = √(T/μ) for the tension T on the slider.
//   transverse:   beads moving up and down, y = A sin(kx − ωt). One bead is
//                 pink: it only ever moves up and down, while the crest
//                 (amber) travels along at v. The bracket marks one λ = v/f.
//   longitudinal: the same wave with the beads displaced along the string,
//                 drawn as layers, like air in a sound wave: compressions
//                 and rarefactions travel, each layer only jiggles in place.
//   pulse:        a single bump travels to the right end and reflects. The
//                 image method gives the exact shape:
//                 y = g(x − vt) ± g(2L − x − vt), minus for a fixed end (the
//                 pulse comes back upside down), plus for a free end (a ring
//                 sliding on a pole: it comes back upright).
// "break it: fixed end, no flip" uses the plus sign with a fixed end: the
// sum is then not zero at the end, so the end itself would have to move.

const W = 560, H = 260;
const L = 4, MU = 0.1;
const X0 = 30, X1 = 530, YM = 120, AMP = 46;          // string ends (px), middle line, amplitude (px)
const N = 41;

type Mode = "trans" | "long" | "pulse";

export function WaveFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("trans");
  const [f, setF] = useState(1.5);
  const [tension, setTension] = useState(0.9);
  const [freeEnd, setFreeEnd] = useState(false);
  const [broken, setBroken] = useState(false);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const vis = useVisible<HTMLDivElement>();

  const v = Math.sqrt(tension / MU), lam = v / f, k = (2 * Math.PI) / lam, w = 2 * Math.PI * f;
  const pulseEnd = (2 * L + 1.4) / v;
  useFrame(playing && vis.on, dt => {
    if (mode === "pulse" && time >= pulseEnd) { setPlaying(false); return; }
    setTime(s => s + dt);
  });
  const restart = (fn: () => void) => { fn(); setTime(0); };
  const play = () => { if (mode === "pulse" && time >= pulseEnd) setTime(0); setPlaying(p => !p); };

  const px = (x: number) => X0 + (x / L) * (X1 - X0);
  const flip = freeEnd || broken ? 1 : -1;
  const g = (u: number) => Math.exp(-(((u + 0.6) / 0.28) ** 2));
  const yPulse = (x: number) => g(x - v * time) + flip * g(2 * L - x - v * time);
  const yWave = (x: number) => Math.sin(k * x - w * time);

  const xs = Array.from({ length: N }, (_, i) => (L * i) / (N - 1));
  const MARK = 10;                                    // the pink bead
  const crest = (() => {                              // first crest position ≥ 0: k x − ω t = π/2 + 2πn
    let x = (Math.PI / 2 + w * time) / k;
    x -= Math.floor(x / lam) * lam;
    return x;
  })();

  let body: React.ReactNode = null;
  if (mode === "trans") {
    const line = Array.from({ length: 201 }, (_, i) => { const x = (L * i) / 200; return `${i ? "L" : "M"}${px(x).toFixed(1)},${(YM - AMP * yWave(x)).toFixed(1)}`; }).join("");
    body = <g>
      <path d={line} fill="none" stroke={C.sky} strokeWidth={1.4} opacity={0.6} />
      {xs.map((x, i) => <circle key={i} cx={px(x)} cy={YM - AMP * yWave(x)} r={i === MARK ? 6 : 3.2} fill={i === MARK ? C.pink : C.sky} />)}
      <line x1={px(xs[MARK])} y1={YM - AMP - 8} x2={px(xs[MARK])} y2={YM + AMP + 8} stroke={C.pink} strokeDasharray="2 3" opacity={0.6} />
      {crest + lam <= L + 1e-9 && <g>
        <line x1={px(crest)} y1={YM - AMP - 14} x2={px(crest + lam)} y2={YM - AMP - 14} stroke={C.green} />
        <line x1={px(crest)} y1={YM - AMP - 19} x2={px(crest)} y2={YM - AMP - 9} stroke={C.green} />
        <line x1={px(crest + lam)} y1={YM - AMP - 19} x2={px(crest + lam)} y2={YM - AMP - 9} stroke={C.green} />
        <T x={px(crest + lam / 2)} y={YM - AMP - 20} anchor="middle" color={C.green} size={8.5}>{`λ = ${f2(lam, 2)} m`}</T>
      </g>}
      <circle cx={px(crest)} cy={YM - AMP} r={4} fill="none" stroke={C.amber} strokeWidth={2} />
      <T x={px(crest)} y={YM + AMP + 22} anchor="middle" color={C.amber} size={8}>{tx(t, "figPhWave_crest", "crest moves at v")}</T>
    </g>;
  } else if (mode === "long") {
    const D = 0.12;                                   // displacement amplitude (m)
    body = <g>
      {Array.from({ length: 81 }, (_, i) => {
        const x0 = (L * i) / 80, x = x0 + D * Math.sin(k * x0 - w * time);
        const mark = i === 20;
        return <line key={i} x1={px(x)} y1={YM - 40} x2={px(x)} y2={YM + 40} stroke={mark ? C.pink : C.sky} strokeWidth={mark ? 3 : 1.3} opacity={mark ? 1 : 0.8} />;
      })}
      <line x1={px(L * 20 / 80)} y1={YM + 48} x2={px(L * 20 / 80)} y2={YM + 54} stroke={C.pink} />
      <T x={px(L * 20 / 80)} y={YM + 66} anchor="middle" color={C.pink} size={8}>{tx(t, "figPhWave_home", "home of the pink layer")}</T>
      <T x={X1} y={YM - 50} anchor="end" color={C.muted} size={8}>{tx(t, "figPhWave_squeeze", "close lines: compression; spread lines: rarefaction")}</T>
    </g>;
  } else {
    const line = Array.from({ length: 321 }, (_, i) => { const x = (L * i) / 320; return `${i ? "L" : "M"}${px(x).toFixed(1)},${(YM - AMP * yPulse(x)).toFixed(1)}`; }).join("");
    const endY = YM - AMP * yPulse(L);
    body = <g>
      <path d={line} fill="none" stroke={C.sky} strokeWidth={2} />
      {freeEnd
        ? <g><line x1={X1 + 6} y1={YM - 70} x2={X1 + 6} y2={YM + 70} stroke={C.fg} strokeWidth={2} />
            <rect x={X1 - 1} y={endY - 6} width={14} height={12} rx={3} fill="none" stroke={C.amber} strokeWidth={2} /></g>
        : <g><line x1={X1} y1={YM - 70} x2={X1} y2={YM + 70} stroke={C.fg} strokeWidth={3} />
            <circle cx={X1} cy={endY} r={4} fill={broken && Math.abs(endY - YM) > 2 ? C.red : C.fg} /></g>}
      {broken && !freeEnd && Math.abs(endY - YM) > 2 && <T x={X1 - 8} y={YM + 88} anchor="end" color={C.red} size={8.5}>{tx(t, "figPhWave_moved", "the fixed end would have to move")}</T>}
      <T x={X1 - 8} y={YM - 78} anchor="end" color={C.muted} size={8}>{freeEnd ? tx(t, "figPhWave_free", "free end: a ring sliding on a pole") : tx(t, "figPhWave_fixed", "fixed end: tied to the wall")}</T>
    </g>;
  }

  const view = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <line x1={X0} y1={YM} x2={X1} y2={YM} stroke={C.grid} strokeDasharray="3 4" />
      {body}
      {[0, 1, 2, 3, 4].map(m => <T key={m} x={px(m)} y={H - 12} anchor="middle" color={C.muted} size={7.5}>{`${m} m`}</T>)}
    </svg>
  );

  return (
    <Figure title={tx(t, "figPhWave_title", "A wave on a string")}
      head={<Choice value={mode} onChange={m => restart(() => { setMode(m); setBroken(false); })} options={[
        ["trans", tx(t, "figPhWave_trans", "transverse")],
        ["long", tx(t, "figPhWave_long", "longitudinal")],
        ["pulse", tx(t, "figPhWave_pulse", "pulse and reflection")],
      ]} />}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figPhWave_T", "tension T")} value={tension} min={0.4} max={4} step={0.1} onChange={v => restart(() => setTension(v))} fmt={v => `${f2(v, 1)} N`} />
          {mode !== "pulse" && <Slider label={tx(t, "figPhWave_f", "frequency f")} value={f} min={0.2} max={2} step={0.05} onChange={setF} fmt={v => `${f2(v, 2)} Hz`} />}
        </Sliders>
        <Row>
          <Readout color={C.amber}>{`v = √(T/μ) = ${f2(v, 2)} m/s`}</Readout>
          {mode !== "pulse" && <Readout color={C.green}>{`λ = v/f = ${f2(lam, 2)} m`}</Readout>}
          {mode !== "pulse" && <Readout>{`${tx(t, "figPhWave_period", "period")} 1/f = ${f2(1 / f, 2)} s`}</Readout>}
          {mode === "pulse" && <>
            <Btn active={!freeEnd} onClick={() => restart(() => setFreeEnd(false))}>{tx(t, "figPhWave_fixedBtn", "fixed end")}</Btn>
            <Btn active={freeEnd} onClick={() => restart(() => { setFreeEnd(true); setBroken(false); })}>{tx(t, "figPhWave_freeBtn", "free end")}</Btn>
            {!freeEnd && <Btn active={broken} onClick={() => restart(() => setBroken(b => !b))}>{tx(t, "figPhWave_broken", "break it: fixed end, no flip")}</Btn>}
          </>}
        </Row>
      </>}
      note={tx(t, "figPhWave_note", "Press play. In the transverse wave, follow the pink bead: it only moves up and down, while the crests travel along the string past it. What travels is the shape and its energy, not the string. Raise the frequency: the crests crowd together, λ = v/f gets shorter, but the crest moves at the same speed, since v is set by the string, not by your hand. Raise the tension: everything speeds up and λ stretches. The longitudinal view shows the same thing with motion along the string, like sound in air. In pulse mode, a bump hits the end: tied to a wall it comes back upside down, on a ring that slides freely it comes back upright. Then break it: if a fixed end reflected the pulse upright, the two halves would add up at the wall and the fixed end would have to move.")}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing} onPlay={play} onReset={() => { setPlaying(false); setTime(0); }}
          onStep={() => { setPlaying(false); setTime(s => +(s + 0.04).toFixed(3)); }}
          readout={`t = ${f2(time, 2)} s`} />
      </div>
    </Figure>
  );
}
