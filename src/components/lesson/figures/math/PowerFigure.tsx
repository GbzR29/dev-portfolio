"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, C, T, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// pattern — the powers b⁻³ … b⁵ in a row. Each step right multiplies by b, each
//           step left divides by b, which is why b⁰ = 1 and b⁻ⁿ = 1/bⁿ.
// root    — a square of area A over a unit grid; its side is √A. Next to it the
//           curve y = √x, which climbs ever more slowly.
// heron   — Heron's method: a rectangle of area x with sides g and x/g; each
//           step replaces g by their average and the rectangle becomes a square.

type Mode = "pattern" | "root" | "heron";
const W = 560;
const EXPS = [-3, -2, -1, 0, 1, 2, 3, 4, 5];
const sup = (e: number) => String(e).replace("-", "⁻").split("").map(c => c === "⁻" ? c : "⁰¹²³⁴⁵⁶⁷⁸⁹"[+c]).join("");
const value = (b: number, n: number) => (n >= 0 ? String(b ** n) : `1/${b ** -n}`);
const trim = (v: number) => f2(v, 6).replace(/\.?0+$/, "");

export function PowerFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("pattern");
  const [base, setBase] = useState<"2" | "3" | "10">("2");
  const [n, setN] = useState(3);
  const [area, setArea] = useState(20);
  const [x, setX] = useState(10);
  const [k, setK] = useState(0);

  let svg: React.ReactNode, H = 150, controls: React.ReactNode, note: string;

  if (mode === "pattern") {
    const b = +base, bw = 52, gap = 8, ox = (W - EXPS.length * (bw + gap) + gap) / 2, by = 44;
    H = 124;
    svg = EXPS.map((e, i) => {
      const x0 = ox + i * (bw + gap), on = e === n, col = e < 0 ? C.purple : e === 0 ? C.amber : C.sky;
      return <g key={e} onClick={() => setN(e)} style={{ cursor: "pointer" }}>
        <rect x={x0} y={by} width={bw} height={40} rx={5} fill={col} fillOpacity={on ? 0.35 : 0.1} stroke={col} strokeWidth={on ? 2 : 1} />
        <T x={x0 + bw / 2} y={by - 8} size={10} anchor="middle" color={on ? C.fg : C.muted} bold={on}>{`${b}${sup(e)}`}</T>
        <T x={x0 + bw / 2} y={by + 24} size={value(b, e).length > 5 ? 8.5 : 10.5} anchor="middle" color={C.fg} bold={on}>{value(b, e)}</T>
        {i < EXPS.length - 1 && <>
          <T x={x0 + bw + gap / 2} y={by - 30} size={8} anchor="middle" color={C.green}>{`×${b}`}</T>
          <T x={x0 + bw + gap / 2} y={by + 70} size={8} anchor="middle" color={C.red}>{`÷${b}`}</T>
          <path d={`M${x0 + bw - 8} ${by - 20} q ${gap / 2 + 8} -8 ${gap + 16} 0`} fill="none" stroke={C.green} strokeWidth={1} />
          <path d={`M${x0 + bw + gap + 8} ${by + 50} q ${-gap / 2 - 8} 8 ${-gap - 16} 0`} fill="none" stroke={C.red} strokeWidth={1} />
        </>}
      </g>;
    });
    const copies = Array(Math.abs(n)).fill(base).join(" × ");
    controls = <>
      <Row>
        <Choice value={base} onChange={setBase} options={[["2", tx(t, "figPow_base", "base") + " 2"], ["3", "3"], ["10", "10"]] as const} />
        <Slider label={tx(t, "figPow_exp", "exponent n")} value={n} min={-3} max={5} step={1} onChange={setN} fmt={v => String(v)} />
      </Row>
      <Row>
        <Readout color={n < 0 ? C.purple : n === 0 ? C.amber : C.sky}>
          {n > 0 ? `${b}${sup(n)} = ${copies} = ${value(b, n)}`
            : n === 0 ? `${b}⁰ = 1 (${tx(t, "figPow_noCopies", "no copies: the empty product")})`
              : `${b}${sup(n)} = 1 / (${copies}) = ${value(b, n)} = ${trim(b ** n)}`}
        </Readout>
      </Row>
    </>;
    note = tx(t, "figPow_notePattern", "Click a box or move the slider. Going right multiplies by the base once more; going left undoes that, dividing by the base. Follow the pattern down past 1: one step left of b¹ = b is b ÷ b = 1, so b⁰ = 1, and the steps after that give 1/b, 1/b², 1/b³. A negative exponent counts divisions instead of multiplications, and the result is small, never negative.");
  } else if (mode === "root") {
    const s = Math.sqrt(area), u = 17, gx = 30, gy = 8, N = 8;
    const px0 = 230, px1 = 540, py0 = 144, py1 = 10;
    const PX = (v: number) => px0 + (v / 64) * (px1 - px0), PY = (v: number) => py0 - (v / 8) * (py0 - py1);
    const perfect = Math.abs(s - Math.round(s)) < 1e-9;
    const curve = Array.from({ length: 65 }, (_, i) => `${i ? "L" : "M"}${PX(i)} ${PY(Math.sqrt(i))}`).join("");
    H = 160;
    svg = <>
      {Array.from({ length: N + 1 }, (_, i) => <g key={i}>
        <line x1={gx + i * u} x2={gx + i * u} y1={gy} y2={gy + N * u} stroke={C.grid} />
        <line x1={gx} x2={gx + N * u} y1={gy + i * u} y2={gy + i * u} stroke={C.grid} />
      </g>)}
      <rect x={gx} y={gy + (N - s) * u} width={s * u} height={s * u} fill={perfect ? C.green : C.sky} fillOpacity={0.3} stroke={perfect ? C.green : C.sky} strokeWidth={1.8} />
      <T x={gx + (s * u) / 2} y={gy + N * u + 12} size={9} anchor="middle" color={C.fg}>{`√${area} = ${f2(s, 3)}`}</T>

      <line x1={px0} x2={px1} y1={py0} y2={py0} stroke={C.axis} />
      <line x1={px0} x2={px0} y1={py0} y2={py1} stroke={C.axis} />
      {[0, 16, 32, 48, 64].map(v => <T key={v} x={PX(v)} y={py0 + 12} size={8} anchor="middle">{String(v)}</T>)}
      {[2, 4, 6, 8].map(v => <T key={v} x={px0 - 5} y={PY(v) + 3} size={8} anchor="end">{String(v)}</T>)}
      {[1, 4, 9, 16, 25, 36, 49, 64].map(v => <circle key={v} cx={PX(v)} cy={PY(Math.sqrt(v))} r={2.2} fill={C.green} />)}
      <path d={curve} fill="none" stroke={C.sky} strokeWidth={1.8} />
      <line x1={PX(area)} x2={PX(area)} y1={py0} y2={PY(s)} stroke={C.amber} strokeDasharray="3 3" />
      <line x1={px0} x2={PX(area)} y1={PY(s)} y2={PY(s)} stroke={C.amber} strokeDasharray="3 3" />
      <circle cx={PX(area)} cy={PY(s)} r={4.5} fill={C.amber} />
      <T x={px1} y={py1 + 10} size={9} anchor="end" color={C.sky}>y = √x</T>
    </>;
    const lo = Math.floor(s), hi = Math.ceil(s);
    controls = <>
      <Slider label={tx(t, "figPow_area", "area A")} value={area} min={0} max={64} step={0.5} onChange={setArea} fmt={v => String(v)} width="w-40" />
      <Row>
        <Readout color={perfect ? C.green : C.sky}>{perfect ? `${area} = ${s}² ${tx(t, "figPow_perfect", "is a perfect square")}`
          : `${lo}² = ${lo * lo} < ${area} < ${hi * hi} = ${hi}²  →  ${lo} < √${area} < ${hi}`}</Readout>
        <Readout color={C.amber}>√{area} = {f2(s, 4)}</Readout>
      </Row>
    </>;
    note = tx(t, "figPow_noteRoot", "Drag the area. The square on the left always has that area, so its side is √A, measured in grid units. The side lands exactly on a grid line only for the perfect squares 1, 4, 9 … 64 (green dots on the curve); in between, √A is squeezed between two whole numbers. The curve on the right shows why roots grow slowly: to double the side you must quadruple the area.");
  } else {
    const gs = [x];
    for (let i = 0; i < 6; i++) gs.push(0.5 * (gs[i] + x / gs[i]));
    const sc = Math.min((W - 40) / x, 140 / Math.sqrt(x)), ox = 20, base0 = 150;
    H = 160;
    svg = <>
      {gs.slice(0, k + 1).map((g, i) => {
        const on = i === k, col = on ? C.amber : C.axis;
        return <rect key={i} x={ox} y={base0 - (x / g) * sc} width={g * sc} height={(x / g) * sc}
          fill={on ? C.amber : "none"} fillOpacity={0.25} stroke={col} strokeWidth={on ? 2 : 1} strokeDasharray={on ? undefined : "3 3"} />;
      })}
      <rect x={ox} y={base0 - Math.sqrt(x) * sc} width={Math.sqrt(x) * sc} height={Math.sqrt(x) * sc} fill="none" stroke={C.green} strokeWidth={1} />
      <T x={ox + gs[k] * sc - 4} y={base0 - 6} size={9} anchor="end" color={C.fg}>{`g = ${f2(gs[k], 4)}`}</T>
      <T x={ox + 4} y={base0 - (x / gs[k]) * sc + ((x / gs[k]) * sc > 30 ? 13 : -5)} size={9} color={C.fg}>{`x/g = ${f2(x / gs[k], 4)}`}</T>
    </>;
    controls = <>
      <Row>
        <Slider label="x" value={x} min={2} max={100} step={1} onChange={v => { setX(v); setK(0); }} fmt={v => String(v)} width="w-36" />
        <Btn onClick={() => setK(Math.min(k + 1, 6))}>{tx(t, "figPow_step", "average step")}</Btn>
        <Btn onClick={() => setK(0)}>{tx(t, "figPow_reset", "reset")}</Btn>
      </Row>
      <Row>{gs.slice(0, k + 1).map((g, i) => <Readout key={i} color={i === k ? C.amber : undefined}>{`g${"₀₁₂₃₄₅₆"[i]} = ${f2(g, 6)}`}</Readout>)}</Row>
      <Row><Readout color={C.green}>√{x} = {f2(Math.sqrt(x), 6)}</Readout><Readout>{tx(t, "figPow_err", "error")}: {gs[k] - Math.sqrt(x) < 5e-7 ? "< 10⁻⁶" : f2(gs[k] - Math.sqrt(x), 6)}</Readout></Row>
    </>;
    note = tx(t, "figPow_noteHeron", "Every rectangle drawn has area x: sides g and x/g. The first guess is g = x, a long strip one unit tall. Press the button: the new g is the average of the two sides, and the rectangle becomes more square. The green outline is the target square with side √x. After three or four steps the rectangle covers it to drawing precision, and the error column shows the digits doubling: the error is roughly squared each step.");
  }

  return (
    <Figure
      title={tx(t, "figPow_title", "Powers and roots")}
      head={<Choice value={mode} onChange={setMode} options={[["pattern", tx(t, "figPow_pattern", "exponent pattern")], ["root", tx(t, "figPow_root", "square root")], ["heron", tx(t, "figPow_heron", "Heron's method")]] as const} />}
      controls={controls}
      note={note}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
