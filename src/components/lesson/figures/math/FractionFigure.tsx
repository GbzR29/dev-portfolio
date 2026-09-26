"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Fractions as lengths on bars where one whole is a fixed width.
// equivalent — a/b and (a·k)/(b·k) cover the same length with finer slices;
//              dividing top and bottom by their GCD gives the simplest form.
// add        — a/b ± c/d: both bars are re-sliced into L = lcm(b, d) pieces so
//              the pieces are the same size and can be counted together.
// multiply   — area model: a/b of the width times c/d of the height; the
//              overlap is a·c of the b·d cells.
// divide     — how many copies of c/d fit into a/b: (a/b) ÷ (c/d) = (a·d)/(b·c).

type Mode = "eq" | "add" | "mul" | "div";
export const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;
const frac = (p: number, q: number) => { const g = gcd(p, q) || 1; return q / g === 1 ? `${p / g}` : `${p / g}/${q / g}`; };
const m = (s: string) => s.replace(/-/g, "−");

const X0 = 52, UNIT = 240;                          // one whole = 240 viewBox units

/** A bar from 0 to 2 wholes, sliced into `q` pieces per whole, with `p` pieces shaded. */
function Bar({ y, p, q, color, label, from = 0, h = 22 }: { y: number; p: number; q: number; color: string; label: string; from?: number; h?: number }) {
  const w = UNIT / q, n = Math.max(q, Math.ceil((from + p) / q) * q);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const on = i >= from && i < from + p;
        return <rect key={i} x={X0 + i * w} y={y} width={w} height={h} fill={on ? color : "none"} fillOpacity={on ? 0.75 : 0} stroke={C.axis} strokeWidth={0.8} />;
      })}
      <rect x={X0} y={y} width={UNIT} height={h} fill="none" stroke={C.fg} strokeWidth={1.4} />
      <T x={X0 - 6} y={y + h / 2 + 3.5} size={10} anchor="end" color={color} bold>{label}</T>
    </g>
  );
}

export function FractionFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("eq");
  const [a, setA] = useState(2), [b, setB] = useState(3);
  const [c, setC] = useState(1), [d, setD] = useState(4);
  const [k, setK] = useState(2);
  const [sub, setSub] = useState<"+" | "−">("+");
  const W = 560;
  const small = mode === "mul" || mode === "add";   // keep sums within the two drawn wholes
  const pick = (v: Mode) => {
    setMode(v);
    if (v === "mul" || v === "add") { setA(x => Math.min(x, b)); setC(x => Math.min(x, d)); }
  };

  const aa = mode === "mul" ? Math.min(a, b) : a, cc = mode === "mul" ? Math.min(c, d) : c;
  const L = lcm(b, d), pa = a * (L / b), pc = c * (L / d);
  const sum = sub === "+" ? pa + pc : pa - pc;
  const g = gcd(a, b);

  const oneMark = (y1: number, y2: number) => <>
    <line x1={X0 + UNIT} x2={X0 + UNIT} y1={y1} y2={y2} stroke={C.fg} strokeDasharray="3 3" />
    <T x={X0 + UNIT} y={y1 - 3} size={8.5} anchor="middle" color={C.fg}>1</T>
    <T x={X0} y={y1 - 3} size={8.5} anchor="middle" color={C.fg}>0</T>
    <T x={X0 + 2 * UNIT} y={y1 - 3} size={8.5} anchor="middle" color={C.fg}>2</T>
  </>;

  let svg: React.ReactNode = null, H = 150;
  if (mode === "eq") {
    H = 140;
    svg = <>{oneMark(20, 130)}
      <Bar y={28} p={a} q={b} color={C.sky} label={`${a}/${b}`} />
      <Bar y={64} p={a * k} q={b * k} color={C.amber} label={`${a * k}/${b * k}`} />
      <Bar y={100} p={a / g} q={b / g} color={C.green} label={frac(a, b)} />
    </>;
  } else if (mode === "add") {
    H = 180;
    svg = <>{oneMark(20, 170)}
      <Bar y={28} p={a} q={b} color={C.sky} label={`${a}/${b}`} />
      <Bar y={60} p={c} q={d} color={C.amber} label={`${c}/${d}`} />
      <Bar y={100} p={pa} q={L} color={C.sky} label={`${pa}/${L}`} />
      {sub === "+"
        ? <Bar y={100} p={pc} q={L} from={pa} color={C.amber} label="" />
        : Array.from({ length: Math.min(pc, pa) }, (_, i) => {
          const x = X0 + (pa - 1 - i) * (UNIT / L);
          return <line key={i} x1={x} x2={x + UNIT / L} y1={122} y2={100} stroke={C.red} strokeWidth={2} />;
        })}
      <Bar y={138} p={Math.max(0, sum)} q={L} color={C.green} label={sum < 0 ? "< 0" : m(frac(sum, L))} />
    </>;
  } else if (mode === "mul") {
    const S = 150, ox = 170, oy = 16;
    H = S + 36;
    svg = <g>
      {Array.from({ length: b * d }, (_, i) => {
        const col = i % b, row = Math.floor(i / b);
        const inA = col < aa, inC = row < cc;
        const fill = inA && inC ? C.purple : inA ? C.sky : inC ? C.amber : "none";
        return <rect key={i} x={ox + (col * S) / b} y={oy + S - ((row + 1) * S) / d} width={S / b} height={S / d}
          fill={fill} fillOpacity={inA && inC ? 0.85 : 0.3} stroke={C.axis} strokeWidth={0.7} />;
      })}
      <rect x={ox} y={oy} width={S} height={S} fill="none" stroke={C.fg} strokeWidth={1.4} />
      <T x={ox + (aa * S) / b / 2} y={oy + S + 14} size={10} anchor="middle" color={C.sky} bold>{`${aa}/${b}`}</T>
      <T x={ox - 8} y={oy + S - (cc * S) / d / 2 + 3} size={10} anchor="end" color={C.amber} bold>{`${cc}/${d}`}</T>
      <T x={ox + S + 18} y={oy + 40} size={10} color={C.purple} bold>{`${aa}·${cc} = ${aa * cc}`}</T>
      <T x={ox + S + 18} y={oy + 56} size={9}>{tx(t, "figFrac_cells", "shaded cells")}</T>
      <T x={ox + S + 18} y={oy + 84} size={10} color={C.fg} bold>{`${b}·${d} = ${b * d}`}</T>
      <T x={ox + S + 18} y={oy + 100} size={9}>{tx(t, "figFrac_all", "cells in the whole")}</T>
    </g>;
  } else {
    const q = (a * d) / (b * c), full = Math.floor(q + 1e-9);
    H = 120;
    svg = <>{oneMark(20, 110)}
      <Bar y={28} p={a} q={b} color={C.sky} label={`${a}/${b}`} />
      {Array.from({ length: Math.min(full + 1, 40) }, (_, i) => {
        const w = (UNIT * c) / d, x = X0 + i * w;
        const end = Math.min(x + w, X0 + (UNIT * a) / b);
        if (end <= x + 0.01) return null;
        return <g key={i}>
          <rect x={x} y={70} width={end - x} height={22} fill={i % 2 ? C.amber : C.orange} fillOpacity={i < full ? 0.75 : 0.3} stroke={C.fg} strokeWidth={0.8} />
          {end - x > 14 && <T x={(x + end) / 2} y={85} size={9} anchor="middle" color="#0b1220" bold>{i < full ? `${i + 1}` : ""}</T>}
        </g>;
      })}
      <T x={X0 - 6} y={85} size={10} anchor="end" color={C.amber} bold>{`${c}/${d}`}</T>
    </>;
  }

  const res = mode === "eq" ? `${a}/${b} = ${a * k}/${b * k} = ${frac(a, b)}`
    : mode === "add" ? `${a}/${b} ${sub} ${c}/${d} = ${pa}/${L} ${sub} ${pc}/${L} = ${m(frac(sum, L))}`
      : mode === "mul" ? `${aa}/${b} × ${cc}/${d} = ${aa * cc}/${b * d} = ${frac(aa * cc, b * d)}`
        : `${a}/${b} ÷ ${c}/${d} = ${a}/${b} × ${d}/${c} = ${frac(a * d, b * c)} ≈ ${((a * d) / (b * c)).toFixed(3)}`;

  return (
    <Figure
      title={tx(t, "figFrac_title", "Fractions as lengths")}
      head={<Choice value={mode} onChange={pick} options={[["eq", tx(t, "figFrac_eq", "equivalent")], ["add", tx(t, "figFrac_add", "add / subtract")], ["mul", tx(t, "figFrac_mul", "multiply")], ["div", tx(t, "figFrac_div", "divide")]] as const} />}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figFrac_a", "numerator a")} value={a} min={mode === "div" ? 1 : 0} max={small ? b : 2 * b} step={1} onChange={setA} fmt={v => `${v}`} width="w-28" />
          <Slider label={tx(t, "figFrac_b", "denominator b")} value={b} min={1} max={12} step={1} onChange={v => { setB(v); setA(x => Math.min(x, small ? v : 2 * v)); }} fmt={v => `${v}`} width="w-28" />
          {mode === "eq"
            ? <Slider label={tx(t, "figFrac_k", "multiply both by k")} value={k} min={1} max={6} step={1} onChange={setK} fmt={v => `${v}`} width="w-28" />
            : <>
              <Slider label={tx(t, "figFrac_c", "numerator c")} value={c} min={1} max={small ? d : 2 * d} step={1} onChange={setC} fmt={v => `${v}`} width="w-28" />
              <Slider label={tx(t, "figFrac_d", "denominator d")} value={d} min={1} max={12} step={1} onChange={v => { setD(v); setC(x => Math.min(x, small ? v : 2 * v)); }} fmt={v => `${v}`} width="w-28" />
            </>}
        </Sliders>
        <Row>
          {mode === "add" && <Choice value={sub} onChange={setSub} options={[["+", "+"], ["−", "−"]] as const} />}
          <Readout color={C.green}>{res}</Readout>
          {mode === "add" && <Readout>{tx(t, "figFrac_lcd", "common denominator")} lcm({b}, {d}) = {L}</Readout>}
          {mode === "eq" && <Readout>gcd({a}, {b}) = {g}</Readout>}
        </Row>
      </>}
      note={mode === "eq"
        ? tx(t, "figFrac_noteEq", "One whole is the distance from 0 to 1. The blue bar cuts each whole into b slices and shades a of them. Multiplying top and bottom by the same k cuts every slice into k thinner ones: there are k times more slices and k times more are shaded, so the length (the value) does not change. Going the other way, dividing top and bottom by their greatest common divisor, gives the green bar: the same length with the fewest slices.")
        : mode === "add"
          ? tx(t, "figFrac_noteAdd", "You can only count slices together when they are the same size. So both fractions are re-sliced into L pieces per whole, where L is a common multiple of b and d (here the least one). Now a/b is (a·L/b) pieces and c/d is (c·L/d) pieces of the same size, and adding or subtracting is just counting. The result is simplified at the end.")
          : mode === "mul"
            ? tx(t, "figFrac_noteMul", "Taking a/b of c/d is an area: the unit square is cut into b columns and d rows, so each cell is 1/(b·d) of it. The blue columns are a/b of the width, the amber rows c/d of the height, and their purple overlap is a·c cells. That is why you multiply tops together and bottoms together. The product is smaller than both factors because each is less than 1.")
            : tx(t, "figFrac_noteDiv", "Dividing by c/d asks: how many pieces of length c/d fit into a/b? The orange pieces are laid end to end along a/b; whole ones are numbered and the last, partial one is faded. Counting always agrees with the rule \"multiply by the reciprocal\": a/b ÷ c/d = a/b × d/c. Dividing by a number less than 1 gives a bigger result, because small pieces fit many times.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
