"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, Slider, C, T, clamp } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A linear equation a·x + b = c·x + d as a balance. Blue boxes are unknowns
// (each weighs x), green squares weigh +1, red squares −1 (think balloons).
// guess — the slider tries a value for x: the beam tilts toward the heavier
//         side and is level only at the solution.
// step  — solves it the textbook way, one "same thing to both sides" move at a
//         time: remove the x's from the right, remove the constant from the
//         left, then divide by the number of x's.

type Eq = { a: number; b: number; c: number; d: number };
type Step = { eq: Eq; move: string; div?: number };

const PRESETS: Eq[] = [
  { a: 2, b: 3, c: 0, d: 11 },
  { a: 3, b: -4, c: 1, d: 6 },
  { a: 5, b: 2, c: 2, d: 14 },
  { a: 1, b: 7, c: 3, d: 1 },
  { a: 2, b: 1, c: 2, d: 5 },
];

const n = (v: number) => (Object.is(v, -0) ? 0 : +v.toFixed(3)).toString().replace("-", "−");

/** "3x − 4" — one side of the equation. */
function side(k: number, m: number) {
  const xs = k === 0 ? "" : `${k === 1 ? "" : k === -1 ? "−" : n(k)}x`;
  if (m === 0) return xs || "0";
  if (!xs) return n(m);
  return `${xs} ${m < 0 ? "−" : "+"} ${n(Math.abs(m))}`;
}
const show = (e: Eq) => `${side(e.a, e.b)} = ${side(e.c, e.d)}`;

/** The solving moves, each applied to both sides. */
function solve(e0: Eq, t?: TrackTranslations): Step[] {
  const steps: Step[] = [{ eq: e0, move: tx(t, "figBal_start", "the equation") }];
  let e = { ...e0 };
  if (e.c !== 0) {
    const k = e.c;
    e = { a: e.a - k, b: e.b, c: 0, d: e.d };
    steps.push({ eq: e, move: `${k > 0 ? "−" : "+"} ${side(Math.abs(k), 0)} ${tx(t, "figBal_both", "on both sides")}` });
  }
  if (e.b !== 0) {
    const m = e.b;
    e = { a: e.a, b: 0, c: 0, d: e.d - m };
    steps.push({ eq: e, move: `${m > 0 ? "−" : "+"} ${n(Math.abs(m))} ${tx(t, "figBal_both", "on both sides")}` });
  }
  if (e.a !== 0 && e.a !== 1) {
    const k = e.a;
    e = { a: 1, b: 0, c: 0, d: e.d / k };
    steps.push({ eq: e, move: `÷ ${n(k)} ${tx(t, "figBal_both", "on both sides")}`, div: k });
  }
  return steps;
}

export function BalanceFigure({ t }: { t?: TrackTranslations }) {
  const [preset, setPreset] = useState(1);
  const [step, setStep] = useState(0);
  const [guess, setGuess] = useState(2);
  const e0 = PRESETS[preset];
  const steps = solve(e0, t);
  const cur = steps[Math.min(step, steps.length - 1)];
  const e = cur.eq;
  const load = (i: number) => { setPreset(i); setStep(0); };

  const L = e.a * guess + e.b, R = e.c * guess + e.d;
  const tilt = clamp((L - R) * 2.2, -14, 14);       // degrees; positive = left side down
  const noX = e0.a === e0.c;
  const sol = noX ? NaN : (e0.d - e0.b) / (e0.a - e0.c);
  const level = Math.abs(L - R) < 1e-9;

  const W = 560, H = 230, PX = W / 2, PY = 60, ARM = 170;
  const rad = (tilt * Math.PI) / 180;
  const end = (s: -1 | 1) => ({ x: PX + s * ARM * Math.cos(rad), y: PY - s * ARM * Math.sin(rad) });

  // Contents of one pan: x boxes, then +1 and −1 squares, laid out in rows.
  const pan = (k: number, m: number, cx: number, top: number) => {
    const items: { kind: "x" | "+" | "-"; neg?: boolean }[] = [];
    for (let i = 0; i < Math.abs(k); i++) items.push({ kind: "x", neg: k < 0 });
    const whole = Number.isInteger(m);
    if (whole) for (let i = 0; i < Math.abs(m); i++) items.push({ kind: m > 0 ? "+" : "-" });
    const per = 7, sz = 14, gap = 3;
    const rows = Math.ceil(items.length / per) || 1;
    return (
      <g>
        {items.map((it, i) => {
          const r = Math.floor(i / per), col = i % per, inRow = Math.min(per, items.length - r * per);
          const x = cx - (inRow * (sz + gap)) / 2 + col * (sz + gap);
          const y = top - (rows - r) * (sz + gap);
          const color = it.kind === "x" ? (it.neg ? C.red : C.sky) : it.kind === "+" ? C.green : C.red;
          return (
            <g key={i}>
              <rect x={x} y={y} width={sz} height={sz} rx={it.kind === "x" ? 3 : 2} fill={color} fillOpacity={0.3} stroke={color} strokeWidth={1.2} strokeDasharray={it.kind === "-" ? "3 2" : undefined} />
              <T x={x + sz / 2} y={y + sz / 2 + 3.5} size={8.5} anchor="middle" color={color} bold>{it.kind === "x" ? (it.neg ? "−x" : "x") : it.kind === "+" ? "1" : "−1"}</T>
            </g>
          );
        })}
        {!whole && <T x={cx} y={top - 8} size={11} anchor="middle" color={C.green} bold>{n(m)}</T>}
      </g>
    );
  };

  const drawPan = (s: -1 | 1, k: number, m: number) => {
    const p = end(s), bottom = p.y + 70;
    return (
      <g>
        <line x1={p.x} y1={p.y} x2={p.x - 50} y2={bottom} stroke={C.axis} strokeWidth={1} />
        <line x1={p.x} y1={p.y} x2={p.x + 50} y2={bottom} stroke={C.axis} strokeWidth={1} />
        {pan(k, m, p.x, bottom - 2)}
        <path d={`M${p.x - 66},${bottom} L${p.x + 66},${bottom} L${p.x + 54},${bottom + 8} L${p.x - 54},${bottom + 8} Z`} fill={C.axis} opacity={0.6} />
        <T x={p.x} y={bottom + 24} size={10} anchor="middle" color={C.fg}>{`${side(k, m)} → ${n(k * guess + m)}`}</T>
      </g>
    );
  };

  return (
    <Figure
      title={tx(t, "figBal_title", "An equation is a balance")}
      controls={<>
        <Row>
          {PRESETS.map((p, i) => <Btn key={i} active={i === preset} onClick={() => load(i)}>{show(p)}</Btn>)}
        </Row>
        <Slider label={tx(t, "figBal_guess", "try x =")} value={guess} min={-4} max={8} step={0.5} onChange={setGuess} fmt={n} width="w-16" />
        <Row>
          <Btn onClick={() => setStep(s => Math.max(0, s - 1))}>{tx(t, "figBal_back", "◀ back")}</Btn>
          <Btn active onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}>{tx(t, "figBal_step", "solve step ▶")}</Btn>
          <Readout>{show(e)}</Readout>
          <Readout color={C.amber}>{cur.move}</Readout>
        </Row>
        <Readout color={level ? C.green : C.muted}>
          {noX
            ? (e0.b === e0.d ? tx(t, "figBal_all", "every x balances: infinitely many solutions") : tx(t, "figBal_none", "the x's cancel and the constants differ: no x can balance it"))
            : level ? `${tx(t, "figBal_level", "level: x =")} ${n(guess)} ${tx(t, "figBal_isSol", "is the solution")}`
              : `${n(L)} ${L > R ? ">" : "<"} ${n(R)} — ${tx(t, "figBal_solIs", "the solution is x =")} ${n(sol)}`}
        </Readout>
      </>}
      note={tx(t, "figBal_note", "Blue boxes each weigh x, green squares weigh 1 and red dashed squares pull up by 1 (a −1 is a balloon). Move the slider to try values of x: the beam tips toward the heavier side and is level only when both sides have the same value, which is exactly what the equation claims. Then press solve step: each move does the same thing to both pans, so a level balance stays level, until a single x is left alone on one side. Try the last preset: the x's cancel and the pans can never balance.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <path d={`M${PX},${PY} L${PX - 16},${H - 12} L${PX + 16},${H - 12} Z`} fill={C.axis} opacity={0.35} />
        <line x1={end(-1).x} y1={end(-1).y} x2={end(1).x} y2={end(1).y} stroke={level ? C.green : C.fg} strokeWidth={3} strokeLinecap="round" />
        <circle cx={PX} cy={PY} r={5} fill={level ? C.green : C.fg} />
        {drawPan(-1, e.a, e.b)}
        {drawPan(1, e.c, e.d)}
        <T x={PX} y={PY - 14} size={14} anchor="middle" color={level ? C.green : C.muted} bold>{level ? "=" : L > R ? ">" : "<"}</T>
      </svg>
    </Figure>
  );
}
