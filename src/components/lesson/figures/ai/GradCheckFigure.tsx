"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, C, T, plot } from "@/components/lesson/kit/figure";
import { netFrom } from "./mlp";
import { BUGS, checkRows, trainCurve, type Bug } from "./gradBugs";

// ── What this figure shows ────────────────────────────────────────────────────
// "Break it" for backpropagation. The chapter's 2-2-1 network on the four XOR
// examples, with the gradient computed by backprop with one classic bug at a
// time, next to the central-difference estimate (L(θ + h) − L(θ − h)) / 2h.
// The relative error column gives every bug away at once; the loss curve on
// the right shows what training with that gradient would do.

const X = [[0, 0], [0, 1], [1, 0], [1, 1]];
const Y = [0, 1, 1, 0];
const NET = netFrom([
  { W: [[0.5, -0.5], [0.3, 0.8]], b: [0.1, -0.2], act: "sigmoid" },
  { W: [[0.7, -0.6]], b: [0.2], act: "sigmoid" },
]);
const EPOCHS = 2000;
const P = plot({ W: 240, H: 150, x0: 0, x1: EPOCHS, y0: 0, y1: 1 });

/** 5.2·10⁻⁸ style: one decimal and a superscript exponent. */
function sci(v: number) {
  if (v === 0) return "0";
  const e = Math.floor(Math.log10(v)), m = v / 10 ** e;
  if (e === 0) return m.toFixed(2);
  const sup = String(e).split("").map(ch => (ch === "-" ? "⁻" : "⁰¹²³⁴⁵⁶⁷⁸⁹"[+ch])).join("");
  return `${m.toFixed(1)}·10${sup}`;
}

export function GradCheckFigure({ t }: { t?: TrackTranslations }) {
  const [bug, setBug] = useState<Bug>("none");
  const L = (k: string, en: string) => tx(t, `figAiGc_${k}`, en);
  const names: Record<Bug, string> = {
    none: L("none", "correct backprop"),
    noSlope: L("noSlope", "forgot σ' in the hidden delta"),
    slopeOfZ: L("slopeOfZ", "σ' computed as z(1 − z)"),
    sign: L("sign", "output delta y − p"),
    noInput: L("noInput", "∂L/∂w = δ (forgot × input)"),
  };

  const rows = useMemo(() => checkRows(NET, X, Y, bug), [bug]);
  const { curve } = useMemo(() => trainCurve(NET, X, Y, bug, EPOCHS), [bug]);
  const worst = Math.max(...rows.map(r => r.rel));
  const ok = worst < 1e-6;
  const finite = curve.findIndex(v => !Number.isFinite(v));
  const last = finite === -1 ? curve[curve.length - 1] : NaN;

  // the loss curve, clipped to [0, 1]; past a NaN it stops
  const pts = curve.slice(0, finite === -1 ? undefined : finite)
    .filter((_, i) => i % 10 === 0)
    .map((v, i) => `${P.X(i * 10).toFixed(1)},${P.Y(Math.min(v, 1)).toFixed(1)}`).join(" ");

  return (
    <Figure
      title={L("title", "Break the backward pass, catch it with a gradient check")}
      controls={<>
        <Row>{BUGS.map(b => <Btn key={b} active={bug === b} onClick={() => setBug(b)}>{names[b]}</Btn>)}</Row>
        <Row>
          <Readout color={ok ? C.green : C.red}>{L("worst", "worst relative error")} {sci(worst)}</Readout>
          <Readout color={ok ? C.green : C.red}>{ok ? L("pass", "check passed") : L("fail", "check FAILED")}</Readout>
          <Readout>{L("after", "loss after 2000 epochs")} {Number.isFinite(last) ? last.toFixed(4) : "NaN"}</Readout>
        </Row>
      </>}
      note={L("note", "Each row is one parameter of the network: the derivative from backprop, the derivative estimated by nudging that parameter by h = 10⁻⁵ both ways, and their relative difference. With correct code they agree to about 8 digits. Pick a bug. Every one of them produces numbers of a believable size, and the program runs without any error message, yet the check fails at once, and it even points at the layer: the output weights are still right when only the hidden delta is wrong. On the right, gradient descent with that gradient (η = 1, all four examples) from the same start. The correct gradient sits on a plateau near 0.69 for a few hundred epochs, then solves XOR. The bugs get stuck at 0.693 (always 0.5), climb instead of falling, or blow up to NaN.")}
    >
      <div className="grid gap-3 p-3 md:grid-cols-[1fr_auto] items-start">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono border-collapse">
            <thead>
              <tr className="text-[var(--text-muted)]">
                <th className="text-left font-semibold py-1 pr-2">{L("param", "parameter")}</th>
                <th className="text-right font-semibold py-1 px-2">{L("backprop", "backprop")}</th>
                <th className="text-right font-semibold py-1 px-2">{L("numeric", "numeric")}</th>
                <th className="text-right font-semibold py-1 pl-2">{L("rel", "rel. error")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const bad = r.rel >= 1e-6;
                return (
                  <tr key={r.name} className="border-t border-[var(--border)]">
                    <td className="py-0.5 pr-2 text-[var(--text-main)]">{r.name}</td>
                    <td className="py-0.5 px-2 text-right" style={{ color: bad ? C.red : "var(--text-main)" }}>{r.analytic.toFixed(5)}</td>
                    <td className="py-0.5 px-2 text-right text-[var(--text-main)]">{r.numeric.toFixed(5)}</td>
                    <td className="py-0.5 pl-2 text-right font-bold" style={{ color: bad ? C.red : C.green }}>{sci(r.rel)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <svg viewBox={`-30 -8 ${P.W + 38} ${P.H + 30}`} className="w-full md:w-[270px] h-auto" role="img">
          {[0, 0.5, 1].map(v => <g key={v}>
            <line x1={0} x2={P.W} y1={P.Y(v)} y2={P.Y(v)} stroke={C.grid} />
            <T x={-4} y={P.Y(v) + 3} size={8} anchor="end">{v}</T>
          </g>)}
          <line x1={0} x2={P.W} y1={P.Y(Math.log(2))} y2={P.Y(Math.log(2))} stroke={C.muted} strokeDasharray="3 3" />
          <T x={P.W} y={P.Y(Math.log(2)) - 3} size={7.5} anchor="end">ln 2 = 0.693</T>
          <polyline points={pts} fill="none" stroke={ok ? C.green : C.red} strokeWidth={2} />
          {finite !== -1 && <T x={P.X(finite) + 4} y={14} size={9} color={C.red} bold>NaN</T>}
          <T x={P.W / 2} y={P.H + 16} size={8.5} anchor="middle">{L("epochs", "epochs")} (0 – 2000) · {L("loss", "loss")}</T>
        </svg>
      </div>
    </Figure>
  );
}
