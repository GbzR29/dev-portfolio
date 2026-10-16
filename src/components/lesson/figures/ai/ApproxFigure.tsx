"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, Slider, Sliders, C, T, plot, fnPath, f2 } from "@/components/lesson/kit/figure";
import { sig } from "./mlp";

// ── What this figure shows ────────────────────────────────────────────────────
// The universal approximation construction, done by hand. N hidden sigmoid
// neurons, each a soft step σ(s·(x − mᵢ)) centred at mᵢ = i/N; the output
// neuron is linear and adds them up with weights vᵢ = f(xᵢ) − f(xᵢ₋₁) (how
// much the target rises over that step) plus the bias f(0). The result is a
// staircase that follows the target; more neurons give smaller stairs, and a
// larger sharpness gives crisper stairs. No training: every weight is set
// from the target directly.

type Target = "wave" | "bump" | "ramp";
const TARGETS: Record<Target, (x: number) => number> = {
  wave: x => 0.5 + 0.35 * Math.sin(2 * Math.PI * 1.5 * x) * (1 - 0.4 * x),
  bump: x => 0.15 + 0.7 * Math.exp(-((x - 0.55) ** 2) / 0.012),
  ramp: x => (x < 0.4 ? 0.2 : x < 0.7 ? 0.2 + (x - 0.4) * 2 : 0.8 - (x - 0.7) * 1.2),
};

const P = plot({ W: 620, H: 230, x0: -0.02, x1: 1.02, y0: -0.05, y1: 1.05 });

/** The network for target f with n hidden neurons of sharpness `sharp` (relative to the step width). */
function build(f: (x: number) => number, n: number, sharp: number) {
  const s = sharp * n;                                            // slope of each sigmoid, in 1/x units
  const units = Array.from({ length: n }, (_, i) => {
    const m = (i + 0.5) / n;                                      // centre of step i, between samples i/n and (i+1)/n
    return { m, v: f((i + 1) / n) - f(i / n) };
  });
  const net = (x: number) => units.reduce((acc, u) => acc + u.v * sig(s * (x - u.m)), f(0));
  return { units, s, net };
}

/** Largest gap between the network and the target, sampled at 401 points. */
function maxError(f: (x: number) => number, net: (x: number) => number) {
  let e = 0;
  for (let i = 0; i <= 400; i++) e = Math.max(e, Math.abs(net(i / 400) - f(i / 400)));
  return e;
}

export function ApproxFigure({ t }: { t?: TrackTranslations }) {
  const [target, setTarget] = useState<Target>("wave");
  const [n, setN] = useState(6);
  const [sharp, setSharp] = useState(6);
  const [parts, setParts] = useState(true);
  const L = (k: string, en: string) => tx(t, `figAiApprox_${k}`, en);

  const f = TARGETS[target];
  const { units, s, net } = build(f, n, sharp);
  const maxErr = maxError(f, net);

  return (
    <Figure
      title={L("title", "Adding up sigmoids to draw any curve")}
      head={<Choice value={target} onChange={setTarget} options={[["wave", L("wave", "wave")], ["bump", L("bump", "bump")], ["ramp", L("ramp", "ramp")]] as const} />}
      controls={<>
        <Sliders>
          <Slider label={L("n", "hidden neurons N")} value={n} min={1} max={40} step={1} onChange={setN} fmt={v => String(v)} />
          <Slider label={L("sharp", "sharpness")} value={sharp} min={1} max={30} step={1} onChange={setSharp} fmt={v => String(v)} />
        </Sliders>
        <Row>
          <Choice value={parts ? "on" : "off"} onChange={v => setParts(v === "on")} options={[["on", L("partsOn", "show each neuron")], ["off", L("partsOff", "hide them")]] as const} />
          <Readout>{L("params", "parameters")} {3 * n + 1}</Readout>
          <Readout color={maxErr < 0.05 ? C.green : maxErr < 0.15 ? C.amber : C.red}>{L("err", "largest error")} {f2(maxErr, 3)}</Readout>
        </Row>
      </>}
      note={L("note", "The dashed curve is the target. Each hidden neuron is one sigmoid σ(s·(x − m)): a soft step up at its own place m. The output neuron is linear: it starts at the target's value at x = 0 and adds every step, scaled by how much the target rises (or falls, with a negative weight) across that step. The faint curves are the scaled steps. With 1 neuron you get a single smooth step. Add neurons and the staircase hugs the curve closer. Raise the sharpness to 30 and you get a true staircase: its largest error is about half a stair, so it halves every time N doubles. Softer steps blend into each other and follow a smooth target even better. Every weight here was set by hand from the target. That is the point of the theorem: it proves good weights exist, not that training will find them.")}
    >
      <svg viewBox={`0 0 ${P.W} ${P.H}`} className="w-full h-auto" role="img">
        {[0, 0.5, 1].map(y => <line key={y} x1={0} x2={P.W} y1={P.Y(y)} y2={P.Y(y)} stroke={C.grid} />)}
        {parts && units.map((u, i) => (
          <path key={i} d={fnPath(P, x => u.v * sig(s * (x - u.m)), 0, 1, 120)}
            stroke={u.v >= 0 ? C.sky : C.orange} strokeOpacity={0.45} strokeWidth={1.2} fill="none"
            transform={`translate(0,${P.Y(u.v >= 0 ? 0 : -u.v) - P.Y(0)})`} />
        ))}
        <path d={fnPath(P, f, 0, 1)} stroke={C.fg} strokeOpacity={0.7} strokeWidth={2} strokeDasharray="6 4" fill="none" />
        <path d={fnPath(P, net, 0, 1, 400)} stroke={C.purple} strokeWidth={2.4} fill="none" />
        {n <= 20 && units.map((u, i) => <line key={i} x1={P.X(u.m)} x2={P.X(u.m)} y1={P.H - 8} y2={P.H - 2} stroke={C.muted} />)}
        <T x={P.W - 6} y={14} size={9} anchor="end" color={C.purple} bold>{L("netLabel", "network output")}</T>
        <T x={P.W - 6} y={27} size={9} anchor="end">{L("targetLabel", "target (dashed)")}</T>
        <T x={4} y={P.Y(1) + 3} size={8}>1</T>
        <T x={4} y={P.Y(0) - 3} size={8}>0</T>
      </svg>
    </Figure>
  );
}
