"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, Btn, C, T, plot, Grid, fnPath, useRaf, useRerender } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// harmonics — a square or sawtooth wave built by adding sines of 1, 2, 3 …
//             times the base frequency with shrinking amplitudes (a Fourier
//             series). More terms, sharper corners.
// lissajous — x = sin(a·t), y = sin(b·t + φ): two oscillations at right
//             angles. Whole-number ratios a : b give closed figures.
// damped    — A·e^(−λt)·sin(2πft): a sine whose amplitude decays
//             exponentially, the shape of a screen shake or a plucked string.

type Mode = "harmonics" | "lissajous" | "damped";
type Shape = "square" | "saw";
const W = 560, H = 300;
const TAU = Math.PI * 2;
const n2 = (v: number) => (+v.toFixed(2)).toString();

export function HarmonicsFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("harmonics");
  const [shape, setShape] = useState<Shape>("square");
  const [n, setN] = useState(3);
  const [la, setLa] = useState(1), [lb, setLb] = useState(2), [lph, setLph] = useState(0);
  const [lam, setLam] = useState(1.2), [fd, setFd] = useState(3);
  const [run, setRun] = useState(true);
  const clock = useRef(0);
  const rerender = useRerender();
  const ref = useRaf(run && mode === "lissajous", dt => { clock.current = (clock.current + dt) % (TAU * 10); rerender(); });

  let svg: React.ReactNode, controls: React.ReactNode, note: string;

  if (mode === "harmonics") {
    const p = plot({ W, H, x0: 0, x1: 2 * TAU, y0: -1.6, y1: 1.6 });
    // Square: (4/π) Σ sin((2k−1)x)/(2k−1).  Sawtooth: (2/π) Σ (−1)^(k+1) sin(kx)/k.
    const term = (k: number, x: number) => shape === "square"
      ? (4 / Math.PI) * Math.sin((2 * k - 1) * x) / (2 * k - 1)
      : (2 / Math.PI) * (k % 2 ? 1 : -1) * Math.sin(k * x) / k;
    const sum = (x: number) => { let s = 0; for (let k = 1; k <= n; k++) s += term(k, x); return s; };
    const target = (x: number) => shape === "square" ? (Math.sin(x) >= 0 ? 1 : -1) : ((((x + Math.PI) % TAU) + TAU) % TAU) / Math.PI - 1;
    svg = <>
      <Grid p={p} step={Math.PI / 2} labels={false} />
      <path d={fnPath(p, target, 0, 2 * TAU, 1200)} fill="none" stroke={C.muted} strokeWidth={1.2} strokeDasharray="4 3" />
      {n <= 6 && Array.from({ length: n }, (_, i) => <path key={i} d={fnPath(p, x => term(i + 1, x), 0, 2 * TAU, 500)} fill="none" stroke={C.purple} strokeWidth={1} opacity={0.35} />)}
      <path d={fnPath(p, sum, 0, 2 * TAU, 1500)} fill="none" stroke={C.sky} strokeWidth={2.4} />
    </>;
    const terms = shape === "square" ? "sin x + sin 3x/3 + sin 5x/5 + …" : "sin x − sin 2x/2 + sin 3x/3 − …";
    controls = <>
      <Row>
        <Btn active={shape === "square"} onClick={() => setShape("square")}>{tx(t, "figHar_square", "square")}</Btn>
        <Btn active={shape === "saw"} onClick={() => setShape("saw")}>{tx(t, "figHar_saw", "sawtooth")}</Btn>
      </Row>
      <Slider label={tx(t, "figHar_terms", "sines added")} value={n} min={1} max={40} step={1} onChange={setN} fmt={String} width="w-24" />
      <Row><Readout color={C.sky}>{`${shape === "square" ? "4/π" : "2/π"} · (${terms})`}</Readout></Row>
    </>;
    note = tx(t, "figHar_noteH", "The dashed line is the target shape; the blue curve is the sum of the first few sines (the faint purple ones are the individual terms). Each extra sine has a higher frequency and a smaller amplitude and fixes finer detail. With one term it is just a sine; with forty, the corners are sharp, apart from a small overshoot that never goes away (the Gibbs phenomenon). Fourier showed that practically any repeating signal can be built this way, which is how audio compression and equalisers think about sound.");
  } else if (mode === "lissajous") {
    const p = plot({ W, H, x0: -2.8, x1: 2.8, y0: -1.5, y1: 1.5 });
    const L = 1.3, tt = clock.current;
    const path = Array.from({ length: 1201 }, (_, i) => { const s = (i / 1200) * TAU; return `${i ? "L" : "M"}${p.X(L * Math.sin(la * s)).toFixed(1)},${p.Y(L * Math.sin(lb * s + lph)).toFixed(1)}`; }).join("");
    const P = { x: L * Math.sin(la * tt * 0.4), y: L * Math.sin(lb * tt * 0.4 + lph) };
    svg = <>
      <Grid p={p} step={0.5} labels={false} />
      <path d={path} fill="none" stroke={C.sky} strokeWidth={1.8} opacity={0.8} />
      <line x1={p.X(P.x)} y1={p.Y(-L - 0.1)} x2={p.X(P.x)} y2={p.Y(-L - 0.1) + 8} stroke={C.red} strokeWidth={3} />
      <line x1={p.X(-L - 0.1)} y1={p.Y(P.y)} x2={p.X(-L - 0.1) - 8} y2={p.Y(P.y)} stroke={C.green} strokeWidth={3} />
      <circle cx={p.X(P.x)} cy={p.Y(P.y)} r={6} fill={C.amber} />
    </>;
    controls = <>
      <Row><Btn active={run} onClick={() => setRun(v => !v)}>{run ? "❚❚" : "▶"}</Btn></Row>
      <Sliders>
        <Slider label="a" value={la} min={1} max={6} step={1} onChange={setLa} fmt={String} width="w-6" />
        <Slider label="b" value={lb} min={1} max={6} step={1} onChange={setLb} fmt={String} width="w-6" />
        <Slider label="φ" value={lph} min={0} max={Math.PI} step={0.01} onChange={setLph} fmt={v => `${n2(v / Math.PI)}π`} width="w-6" />
      </Sliders>
      <Row><Readout color={C.sky}>{`x = sin(${la}t), y = sin(${lb}t + ${n2(lph / Math.PI)}π)`}</Readout></Row>
    </>;
    note = tx(t, "figHar_noteL", "The amber point moves left and right as sin(a·t) (red tick) and up and down as sin(b·t + φ) (green tick), two independent oscillations at right angles. Its path is a Lissajous figure. When a : b is a ratio of whole numbers the path closes; a = b gives an ellipse (or a line, or a circle when φ = π/2), and 1 : 2 gives a figure eight. Games use these for idle camera sway, hovering drones and patrol loops that look organic but repeat exactly.");
  } else {
    const p = plot({ W, H, x0: 0, x1: 3, y0: -1.4, y1: 1.4 });
    const A = 1.1;
    const f = (x: number) => A * Math.exp(-lam * x) * Math.sin(TAU * fd * x);
    const env = (x: number) => A * Math.exp(-lam * x);
    const half = Math.log(2) / lam;
    svg = <>
      <Grid p={p} step={0.25} major={1} labels={false} />
      {[1, 2].map(x => <T key={x} x={p.X(x)} y={p.Y(0) + 12} size={8.5} anchor="middle">{`${x} s`}</T>)}
      <path d={fnPath(p, env)} fill="none" stroke={C.amber} strokeWidth={1.2} strokeDasharray="4 3" />
      <path d={fnPath(p, x => -env(x))} fill="none" stroke={C.amber} strokeWidth={1.2} strokeDasharray="4 3" />
      <path d={fnPath(p, f, 0, 3, 1200)} fill="none" stroke={C.sky} strokeWidth={2.2} />
      {half < 3 && <>
        <line x1={p.X(half)} y1={p.Y(env(half))} x2={p.X(half)} y2={p.Y(0)} stroke={C.pink} strokeWidth={1.2} />
        <T x={p.X(half) + 4} y={p.Y(env(half)) - 4} size={9.5} color={C.pink}>{tx(t, "figHar_halfA", "half amplitude")}</T>
      </>}
    </>;
    controls = <>
      <Sliders>
        <Slider label={tx(t, "figHar_decay", "decay λ")} value={lam} min={0} max={4} step={0.05} onChange={setLam} fmt={v => `${n2(v)}/s`} />
        <Slider label={tx(t, "figHar_freq", "frequency f")} value={fd} min={0.5} max={8} step={0.25} onChange={setFd} fmt={v => `${n2(v)} Hz`} />
      </Sliders>
      <Row>
        <Readout color={C.sky}>{`y = ${A} · e^(−${n2(lam)}t) · sin(2π · ${n2(fd)} t)`}</Readout>
        <Readout color={C.pink}>{`${tx(t, "figHar_halfLife", "half-life")} ln 2 / λ = ${lam > 0 ? n2(half) + " s" : "∞"}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figHar_noteD", "Multiply a sine by a shrinking exponential (the exponents chapter's e^(−λt)) and the wave dies away inside the dashed envelope. λ sets how fast: the amplitude halves every ln 2 / λ seconds. With λ = 0 it rings forever. This is the shape of a plucked string, a door spring settling, and the screen shake of a game: a big jolt that quickly calms down.");
  }

  return (
    <Figure
      title={tx(t, "figHar_title", "Combining waves")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["harmonics", tx(t, "figHar_mHarm", "harmonics")],
        ["lissajous", tx(t, "figHar_mLiss", "Lissajous")],
        ["damped", tx(t, "figHar_mDamp", "damped")],
      ] as const} />}
      controls={controls}
      note={note}
    >
      <div ref={ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
      </div>
    </Figure>
  );
}
