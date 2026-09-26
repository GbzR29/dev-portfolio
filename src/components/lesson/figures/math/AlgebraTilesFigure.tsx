"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Btn, Row, Readout, Slider, Sliders, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Algebraic expressions as pieces you can see.
// like — an expression's terms as tiles: an x-bar is one x, a small square is
//        one unit, red means subtracted. "Collect" sorts them by kind and lets
//        opposite tiles cancel, which is all "combining like terms" means. The
//        x slider evaluates both forms to show they are the same expression.
// dist — the distributive law as an area: a rectangle k wide and (x + c) long
//        is the same area as the two rectangles k·x and k·c side by side.
// foil — (x + a)(x + b) as a rectangle split into four parts: x², a·x, b·x, a·b.

type Mode = "like" | "dist" | "foil";
type Term = { kind: "x" | "1"; sign: 1 | -1 };

const n = (v: number) => (Object.is(v, -0) ? 0 : +v.toFixed(2)).toString().replace("-", "−");

// Each preset: its terms in written order; the text is built from them.
const PRESETS: Term[][] = [
  [{ kind: "x", sign: 1 }, { kind: "x", sign: 1 }, { kind: "x", sign: 1 }, { kind: "1", sign: 1 }, { kind: "1", sign: 1 }, { kind: "x", sign: -1 }, { kind: "1", sign: 1 }, { kind: "1", sign: 1 }, { kind: "1", sign: 1 }, { kind: "1", sign: 1 }],
  [{ kind: "x", sign: 1 }, { kind: "x", sign: 1 }, { kind: "1", sign: -1 }, { kind: "1", sign: -1 }, { kind: "1", sign: -1 }, { kind: "x", sign: 1 }, { kind: "1", sign: 1 }, { kind: "1", sign: 1 }, { kind: "1", sign: 1 }, { kind: "1", sign: 1 }, { kind: "1", sign: 1 }],
  [{ kind: "x", sign: 1 }, { kind: "x", sign: 1 }, { kind: "x", sign: 1 }, { kind: "x", sign: 1 }, { kind: "1", sign: 1 }, { kind: "x", sign: -1 }, { kind: "x", sign: -1 }, { kind: "x", sign: -1 }, { kind: "x", sign: -1 }, { kind: "1", sign: 1 }],
];

/** Groups consecutive tiles of the same kind and sign into written terms: "3x + 2 − x + 4". */
function written(terms: Term[]) {
  const groups: { kind: Term["kind"]; count: number }[] = [];
  for (const tm of terms) {
    const g = groups[groups.length - 1];
    const v = tm.sign;
    if (g && g.kind === tm.kind && Math.sign(g.count) === v) g.count += v;
    else groups.push({ kind: tm.kind, count: v });
  }
  return groups.map((g, i) => {
    const abs = Math.abs(g.count);
    const body = g.kind === "x" ? `${abs === 1 ? "" : abs}x` : `${abs}`;
    return i === 0 ? (g.count < 0 ? `−${body}` : body) : `${g.count < 0 ? " − " : " + "}${body}`;
  }).join("");
}

function simplified(nx: number, n1: number) {
  const xs = nx === 0 ? "" : `${nx === 1 ? "" : nx === -1 ? "−" : n(nx)}x`;
  if (n1 === 0) return xs || "0";
  if (!xs) return n(n1);
  return `${xs} ${n1 < 0 ? "−" : "+"} ${n(Math.abs(n1))}`;
}

export function AlgebraTilesFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("like");
  const [preset, setPreset] = useState(0);
  const [collected, setCollected] = useState(false);
  const [x, setX] = useState(2);
  const [k, setK] = useState(3);
  const [c, setC] = useState(2);
  const [a, setA] = useState(2);
  const [b, setB] = useState(3);

  const W = 560, H = mode === "like" ? 170 : 230;
  const terms = PRESETS[preset];
  const nx = terms.reduce((s, tm) => s + (tm.kind === "x" ? tm.sign : 0), 0);
  const n1 = terms.reduce((s, tm) => s + (tm.kind === "1" ? tm.sign : 0), 0);

  // ── like terms ──
  const XW = 16, XL = 64, U = 16, GAP = 6;
  const tile = (tm: Term, px: number, py: number, key: string, faded = false) => {
    const col = tm.sign > 0 ? (tm.kind === "x" ? C.sky : C.green) : C.red;
    const w = tm.kind === "x" ? XW : U, h = tm.kind === "x" ? XL : U;
    return (
      <g key={key} opacity={faded ? 0.22 : 1}>
        <rect x={px} y={py} width={w} height={h} rx={3} fill={col} fillOpacity={tm.sign > 0 ? 0.35 : 0.12} stroke={col} strokeWidth={1.4} strokeDasharray={tm.sign > 0 ? undefined : "3 2"} />
        <T x={px + w / 2} y={py + h / 2 + 3.5} size={9} anchor="middle" color={col} bold>{(tm.sign < 0 ? "−" : "") + (tm.kind === "x" ? "x" : "1")}</T>
      </g>
    );
  };
  const likeScene = () => {
    if (!collected) {
      let px = 20;
      return terms.map((tm, i) => {
        const el = tile(tm, px, 50, `t${i}`);
        px += (tm.kind === "x" ? XW : U) + GAP;
        return el;
      });
    }
    // Sorted: x tiles in one row, units in another; opposite pairs are cancelled (faded).
    const row = (kind: Term["kind"], y: number) => {
      const pos = terms.filter(tm => tm.kind === kind && tm.sign > 0).length;
      const neg = terms.filter(tm => tm.kind === kind && tm.sign < 0).length;
      const pairs = Math.min(pos, neg);
      const w = kind === "x" ? XW : U, out = [];
      let px = 20;
      for (let i = 0; i < pos; i++) { out.push(tile({ kind, sign: 1 }, px, y, `${kind}p${i}`, i < pairs)); px += w + GAP; }
      px += 14;
      for (let i = 0; i < neg; i++) { out.push(tile({ kind, sign: -1 }, px, y, `${kind}n${i}`, true)); px += w + GAP; }
      return out;
    };
    return [...row("x", 30), ...row("1", 120)];
  };

  // ── area models ──
  const S = 24;                                     // px per unit of length
  const areaRect = (x0: number, y0: number, w: number, h: number, col: string, label: string, key: string) => (
    <g key={key}>
      <rect x={x0} y={y0} width={w * S} height={h * S} fill={col} fillOpacity={0.22} stroke={col} strokeWidth={1.4} />
      {w * S > 28 && h * S > 16 && <T x={x0 + (w * S) / 2} y={y0 + (h * S) / 2 + 4} size={10} anchor="middle" color={col} bold>{label}</T>}
    </g>
  );

  const X0 = 60, Y0 = 30;
  let scene: React.ReactNode = null, readouts: React.ReactNode = null;
  if (mode === "like") {
    scene = likeScene();
    readouts = <>
      <Readout>{written(terms)}</Readout>
      <Readout color={C.amber}>= {simplified(nx, n1)}</Readout>
      <Readout color={C.muted}>x = {n(x)}: {n(terms.reduce((s, tm) => s + tm.sign * (tm.kind === "x" ? x : 1), 0))} = {n(nx * x + n1)}</Readout>
    </>;
  } else if (mode === "dist") {
    scene = <>
      {areaRect(X0, Y0, x, k, C.sky, `${n(k)}·x`, "kx")}
      {areaRect(X0 + x * S, Y0, c, k, C.green, `${n(k)}·${n(c)}`, "kc")}
      <T x={X0 - 8} y={Y0 + (k * S) / 2 + 4} size={10} anchor="end" color={C.fg} bold>{n(k)}</T>
      <T x={X0 + (x * S) / 2} y={Y0 + k * S + 16} size={10} anchor="middle" color={C.sky}>x = {n(x)}</T>
      <T x={X0 + x * S + (c * S) / 2} y={Y0 + k * S + 16} size={10} anchor="middle" color={C.green}>{n(c)}</T>
    </>;
    readouts = <>
      <Readout>{n(k)}(x + {n(c)}) = {n(k)}x + {n(k * c)}</Readout>
      <Readout color={C.amber}>{n(k)} × {n(x + c)} = {n(k * x)} + {n(k * c)} = {n(k * (x + c))}</Readout>
    </>;
  } else {
    scene = <>
      {areaRect(X0, Y0, x, x, C.purple, "x²", "xx")}
      {areaRect(X0 + x * S, Y0, b, x, C.sky, `${n(b)}x`, "bx")}
      {areaRect(X0, Y0 + x * S, x, a, C.sky, `${n(a)}x`, "ax")}
      {areaRect(X0 + x * S, Y0 + x * S, b, a, C.green, n(a * b), "ab")}
      <T x={X0 + (x * S) / 2} y={Y0 - 6} size={10} anchor="middle" color={C.fg}>x</T>
      <T x={X0 + x * S + (b * S) / 2} y={Y0 - 6} size={10} anchor="middle" color={C.fg}>{n(b)}</T>
      <T x={X0 - 8} y={Y0 + (x * S) / 2 + 4} size={10} anchor="end" color={C.fg}>x</T>
      <T x={X0 - 8} y={Y0 + x * S + (a * S) / 2 + 4} size={10} anchor="end" color={C.fg}>{n(a)}</T>
    </>;
    readouts = <>
      <Readout>(x + {n(a)})(x + {n(b)}) = x² + {n(a + b)}x + {n(a * b)}</Readout>
      <Readout color={C.amber}>x = {n(x)}: {n(x + a)} × {n(x + b)} = {n((x + a) * (x + b))}</Readout>
    </>;
  }

  return (
    <Figure
      title={tx(t, "figTiles_title", "Algebra tiles")}
      head={<Choice value={mode} onChange={setMode} options={[["like", tx(t, "figTiles_like", "like terms")], ["dist", tx(t, "figTiles_dist", "distribute")], ["foil", tx(t, "figTiles_foil", "two brackets")]] as const} />}
      controls={<>
        {mode === "like" && <Row>
          {PRESETS.map((p, i) => <Btn key={i} active={i === preset} onClick={() => { setPreset(i); setCollected(false); }}>{written(p)}</Btn>)}
          <Btn active={collected} onClick={() => setCollected(v => !v)}>{collected ? tx(t, "figTiles_uncollect", "as written") : tx(t, "figTiles_collect", "collect ▶")}</Btn>
        </Row>}
        <Sliders>
          <Slider label="x" value={x} min={0} max={mode === "dist" ? 8 : 5} step={0.5} onChange={setX} fmt={n} />
          {mode === "dist" && <>
            <Slider label="k" value={k} min={1} max={5} step={1} onChange={setK} fmt={n} />
            <Slider label="c" value={c} min={0} max={5} step={1} onChange={setC} fmt={n} />
          </>}
          {mode === "foil" && <>
            <Slider label="a" value={a} min={0} max={3} step={1} onChange={setA} fmt={n} />
            <Slider label="b" value={b} min={0} max={4} step={1} onChange={setB} fmt={n} />
          </>}
        </Sliders>
        <Row>{readouts}</Row>
      </>}
      note={mode === "like"
        ? tx(t, "figTiles_noteLike", "Each blue bar is one x, each green square is one unit, and a red dashed tile is one that is subtracted. Press collect: the tiles are sorted by kind, and every red tile cancels one tile of the same kind, because x − x = 0 and 1 − 1 = 0. What is left is the simplified expression. An x-bar and a unit square never merge: they are different kinds of thing, like metres and seconds. Move the x slider: both forms always give the same number.")
        : mode === "dist"
          ? tx(t, "figTiles_noteDist", "A rectangle k wide and x + c long has area k(x + c). Cut it where x ends and you get two rectangles, k·x and k·c. The total area did not change, so k(x + c) = kx + kc. That is the distributive law: the factor outside the brackets multiplies every term inside.")
          : tx(t, "figTiles_noteFoil", "A square of side x + a by x + b is cut into four pieces: x·x = x², b·x, a·x and a·b. Adding them gives x² + (a + b)x + ab. Every term of the first bracket meets every term of the second exactly once; that is why the two middle pieces are there, and forgetting them is the classic mistake (x + 3)² ≠ x² + 9.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {scene}
        {mode === "like" && collected && <>
          <T x={W - 16} y={66} size={10} anchor="end" color={C.sky} bold>{simplified(nx, 0)}</T>
          <T x={W - 16} y={132} size={10} anchor="end" color={C.green} bold>{n(n1)}</T>
          <T x={W - 16} y={H - 12} size={9} anchor="end" color={C.muted}>{tx(t, "figTiles_faded", "faded = cancelled pairs")}</T>
        </>}
      </svg>
    </Figure>
  );
}
