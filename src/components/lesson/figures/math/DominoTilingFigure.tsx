"use client";

import { useState, type ReactNode } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Sliders, C, T } from "@/components/lesson/kit/figure";
import { fill } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// Every way to tile a 2 × n strip with 1 × 2 dominoes, drawn in full and
// sorted by how the strip ends: with one upright domino (amber), leaving a
// 2 × (n − 1) strip, or with two flat dominoes stacked (purple), leaving a
// 2 × (n − 2) strip. Those are the only two endings, so the count obeys
// Tₙ = Tₙ₋₁ + Tₙ₋₂: the Fibonacci recurrence, found by counting.

type Piece = "V" | "H";
const W = 560, CELL = 11, GAP = 14, PAD = 12;
const sub = (k: number) => String(k).split("").map(d => "₀₁₂₃₄₅₆₇₈₉"[+d]).join("");

/** All tilings of a 2 × n strip, as lists of pieces from left to right. */
function tilings(n: number): Piece[][] {
  const memo: Piece[][][] = [[[]], [["V"]]];
  for (let k = 2; k <= n; k++) memo[k] = [...memo[k - 1].map(x => [...x, "V" as Piece]), ...memo[k - 2].map(x => [...x, "H" as Piece])];
  return memo[n];
}

/** T₀ … T₉, counted from the tilings themselves. */
const COUNTS = Array.from({ length: 10 }, (_, k) => tilings(k).length);

function Strip({ x, y, pieces, n }: { x: number; y: number; pieces: Piece[]; n: number }) {
  const out: ReactNode[] = [];
  let c = 0;
  pieces.forEach((pc, i) => {
    const last = i === pieces.length - 1;
    const col = last ? (pc === "V" ? C.amber : C.purple) : C.sky;
    if (pc === "V") out.push(<rect key={i} x={x + c * CELL + 1} y={y + 1} width={CELL - 2} height={2 * CELL - 2} rx={2} fill={col} opacity={last ? 0.9 : 0.55} />);
    else out.push(
      <g key={i}>
        <rect x={x + c * CELL + 1} y={y + 1} width={2 * CELL - 2} height={CELL - 2} rx={2} fill={col} opacity={last ? 0.9 : 0.55} />
        <rect x={x + c * CELL + 1} y={y + CELL + 1} width={2 * CELL - 2} height={CELL - 2} rx={2} fill={col} opacity={last ? 0.9 : 0.55} />
      </g>,
    );
    c += pc === "V" ? 1 : 2;
  });
  return <g>{out}<rect x={x} y={y} width={n * CELL} height={2 * CELL} fill="none" stroke={C.axis} strokeWidth={1} /></g>;
}

export function DominoTilingFigure({ t }: { t?: TrackTranslations }) {
  const [n, setN] = useState(5);
  const all = tilings(n);
  const endV = all.filter(x => x[x.length - 1] === "V"), endH = all.filter(x => x[x.length - 1] === "H");
  const sw = n * CELL, per = Math.max(1, Math.floor((W / 2 - PAD * 2 + GAP) / (sw + GAP)));
  const rows = (k: number) => Math.ceil(k / per);
  const H = Math.max(rows(endV.length), rows(endH.length)) * (2 * CELL + GAP) + 44;
  const counts = COUNTS;

  const group = (list: Piece[][], x0: number) => list.map((pc, i) => (
    <Strip key={i} x={x0 + (i % per) * (sw + GAP)} y={34 + Math.floor(i / per) * (2 * CELL + GAP)} pieces={pc} n={n} />
  ));

  return (
    <Figure title={tx(t, "figDom_title", "Tiling a 2 × n strip with dominoes")}
      controls={<>
        <Sliders>
          <Slider label="n" value={n} min={1} max={8} step={1} onChange={setN} fmt={v => String(v)} />
        </Sliders>
        <Row>
          <Readout color={C.amber}>{fill(tx(t, "figDom_endV", "ends upright: {a} = T{m}"), { a: endV.length, m: sub(n - 1) })}</Readout>
          <Readout color={C.purple}>{fill(tx(t, "figDom_endH", "ends with two flat: {b} = T{m}"), { b: endH.length, m: sub(Math.max(0, n - 2)) })}</Readout>
          <Readout color={C.green}>{`T${sub(n)} = ${endV.length} + ${endH.length} = ${all.length}`}</Readout>
        </Row>
        <Row>
          <Readout>{`T₁ … T₉: ${counts.slice(1).join(", ")}`}</Readout>
        </Row>
      </>}
      note={tx(t, "figDom_note", "Every tiling of the strip, sorted by its right end. Either the last domino stands upright (amber) and the rest is a tiling of a strip one shorter, or two dominoes lie flat on top of each other (purple) and the rest is a tiling of a strip two shorter. Nothing else can fill the last column, so Tₙ = Tₙ₋₁ + Tₙ₋₂.")}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <T x={PAD} y={20} color={C.amber} bold>{fill(tx(t, "figDom_hV", "last piece upright: {k}"), { k: endV.length })}</T>
        <T x={W / 2 + PAD} y={20} color={C.purple} bold>{fill(tx(t, "figDom_hH", "last two flat: {k}"), { k: endH.length })}</T>
        <line x1={W / 2} x2={W / 2} y1={8} y2={H - 8} stroke={C.grid} strokeWidth={1} />
        {group(endV, PAD)}
        {group(endH, W / 2 + PAD)}
      </svg>
    </Figure>
  );
}
