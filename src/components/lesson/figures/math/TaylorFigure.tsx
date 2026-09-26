"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Sliders, Btn, C, T, plot, Grid, fnPath, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A function (grey) and its Taylor polynomial of degree n around a centre a
// (amber): the polynomial whose value and first n derivatives at a match the
// function's. Raising n makes it hug the curve over a wider stretch. For eˣ
// and sin x that stretch grows forever; for ln(1 + x) and 1/(1 − x) it stops at
// the interval of convergence (shaded), whose half-width is the distance from
// a to the point where the function breaks down.

type Key = "sin" | "exp" | "ln" | "geo";
type Fn = {
  label: string; f: (x: number) => number; coef: (k: number, a: number) => number;
  a: [number, number, number]; view: [number, number, number, number];
  /** Interval of convergence around a, if it is not the whole line. */
  conv?: (a: number) => [number, number];
};

const fact = (k: number) => { let p = 1; for (let i = 2; i <= k; i++) p *= i; return p; };
const W = 560, H = 290;

const FNS: Record<Key, Fn> = {
  sin: { label: "sin x", f: Math.sin, coef: (k, a) => Math.sin(a + (k * Math.PI) / 2) / fact(k), a: [-3, 3, 0], view: [-7.5, 7.5, -2.6, 2.6] },
  exp: { label: "eˣ", f: Math.exp, coef: (k, a) => Math.exp(a) / fact(k), a: [-2, 1.5, 0], view: [-4.5, 3, -1.5, 8] },
  ln: {
    label: "ln(1 + x)", f: x => Math.log(1 + x), a: [-0.5, 1.5, 0], view: [-1.5, 3.8, -3, 2],
    coef: (k, a) => (k === 0 ? Math.log(1 + a) : ((k % 2 ? 1 : -1) / (k * (1 + a) ** k))),
    conv: a => [-1, 1 + 2 * a],
  },
  geo: {
    label: "1/(1 − x)", f: x => 1 / (1 - x), a: [-1, 0.6, 0], view: [-3.2, 2.2, -2, 6],
    coef: (k, a) => 1 / (1 - a) ** (k + 1),
    conv: a => [2 * a - 1, 1],
  },
};

const taylor = (fn: Fn, n: number, a: number) => {
  const c = Array.from({ length: n + 1 }, (_, k) => fn.coef(k, a));
  return (x: number) => { let s = 0, p = 1; for (let k = 0; k <= n; k++) { s += c[k] * p; p *= x - a; } return s; };
};
const s4 = (v: number) => (Number.isFinite(v) ? (Math.abs(v) >= 1e4 ? v.toExponential(2) : f2(v, 5)) : "—").replace("-", "−");

export function TaylorFigure({ t }: { t?: TrackTranslations }) {
  const [key, setKey] = useState<Key>("sin");
  const [n, setN] = useState(3);
  const [a, setA] = useState(0);
  const [x, setX] = useState(1.5);

  const fn = FNS[key];
  const [x0, x1, y0, y1] = fn.view;
  const pr = plot({ W, H, x0, x1, y0, y1 });
  const T_n = taylor(fn, n, a);
  const conv = fn.conv?.(a);
  const fx = fn.f(x), tx_ = T_n(x);
  const inside = !conv || (x > conv[0] && x < conv[1]);
  const pick = (k: Key) => { setKey(k); setA(FNS[k].a[2]); setX(k === "sin" ? 1.5 : k === "exp" ? 1 : 0.5); };

  return (
    <Figure
      title={tx(t, "figTay_title", "Polynomials that copy a function")}
      head={<>{(Object.keys(FNS) as Key[]).map(k => <Btn key={k} active={key === k} onClick={() => pick(k)}>{FNS[k].label}</Btn>)}</>}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figTay_n", "degree n")} value={n} min={0} max={15} step={1} onChange={setN} fmt={v => String(v)} />
          <Slider label={tx(t, "figTay_a", "centre a")} value={a} min={fn.a[0]} max={fn.a[1]} step={0.05} onChange={setA} />
          <Slider label={tx(t, "figTay_x", "test x")} value={x} min={x0 + 0.1} max={x1 - 0.1} step={0.05} onChange={setX} />
        </Sliders>
        <Row>
          <Readout>{`f(x) = ${s4(fx)}`}</Readout>
          <Readout color={C.amber}>{`Tₙ(x) = ${s4(tx_)}`}</Readout>
          <Readout color={Math.abs(fx - tx_) < 1e-3 ? C.green : C.red}>{`${tx(t, "figTay_err", "error")} = ${Number.isFinite(fx - tx_) ? Math.abs(fx - tx_).toExponential(1).replace("-", "−") : "—"}`}</Readout>
          {conv && <Readout color={inside ? C.green : C.red}>{inside ? tx(t, "figTay_in", "inside the interval of convergence") : tx(t, "figTay_out", "outside: more terms make it worse")}</Readout>}
        </Row>
      </>}
      note={tx(t, "figTay_note", "Degree 0 is a flat line at the right height, degree 1 the tangent line, degree 2 adds the bend, and every extra term copies one more derivative at a. For sin x and eˣ, raise n and the copy stays good further and further out, without limit. For ln(1 + x) and 1/(1 − x) the copy is good only inside the green band: it reaches from a to the point where the function breaks down (x = −1 or x = 1) and equally far on the other side. Move the centre a and watch the band change.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {conv && <rect x={pr.X(Math.max(x0, conv[0]))} y={0} width={pr.X(Math.min(x1, conv[1])) - pr.X(Math.max(x0, conv[0]))} height={H} fill={C.green} fillOpacity={0.08} />}
        <Grid p={pr} step={1} labels major={1} />
        <path d={fnPath(pr, fn.f, key === "ln" ? -0.999 : x0, key === "geo" ? 0.999 : x1, 400)} fill="none" stroke={C.fg} strokeWidth={2} opacity={0.55} />
        {key === "geo" && <path d={fnPath(pr, fn.f, 1.001, x1)} fill="none" stroke={C.fg} strokeWidth={2} opacity={0.55} />}
        <path d={fnPath(pr, T_n, x0, x1, 400)} fill="none" stroke={C.amber} strokeWidth={2.2} />
        <line x1={pr.X(x)} x2={pr.X(x)} y1={0} y2={H} stroke={C.purple} strokeDasharray="3 4" />
        <circle cx={pr.X(a)} cy={pr.Y(fn.f(a))} r={4.5} fill={C.amber} stroke="var(--code-bg)" strokeWidth={1.5} />
        <T x={pr.X(a) + 7} y={pr.Y(fn.f(a)) + 14} color={C.amber} bold>a</T>
        <T x={pr.X(x) + 4} y={12} color={C.purple}>x</T>
        <T x={8} y={H - 8} color={C.amber} bold>{`T${n}`.replace(/\d+$/, d => d.split("").map(c => "₀₁₂₃₄₅₆₇₈₉"[+c]).join(""))}</T>
      </svg>
    </Figure>
  );
}
