"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Choice, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Pascal's triangle, rows n = 0 … 10. Entry k of row n is C(n, k), the number
// of ways to choose k items from n. Clicking an entry highlights the two
// entries above it, whose sum it is (Pascal's rule), and prints the binomial
// expansion whose coefficients are that row. The "odd entries" mode colours
// the odd numbers, which trace a Sierpiński triangle.

const ROWS = 11, W = 560, DX = 44, DY = 26, H = 18 + (ROWS - 1) * DY + 18;
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (n: number) => String(n).split("").map(d => SUP[+d]).join("");

const TRI: number[][] = [];
for (let n = 0; n < ROWS; n++) TRI.push(Array.from({ length: n + 1 }, (_, k) => (k === 0 || k === n ? 1 : TRI[n - 1][k - 1] + TRI[n - 1][k])));

/** (a + b)ⁿ written out with the row's coefficients. */
function expansion(n: number) {
  const pow = (v: string, p: number) => (p === 0 ? "" : p === 1 ? v : v + sup(p));
  return TRI[n].map((c, k) => `${c === 1 && n > 0 ? "" : c}${pow("a", n - k)}${pow("b", k)}`).join(" + ");
}

export function PascalFigure({ t }: { t?: TrackTranslations }) {
  const [[n, k], setSel] = useState<[number, number]>([5, 2]);
  const [mode, setMode] = useState<"sum" | "odd">("sum");

  const cx = (r: number, c: number) => W / 2 + (c - r / 2) * DX;
  const cy = (r: number) => 18 + r * DY;
  const isParent = (r: number, c: number) => mode === "sum" && r === n - 1 && (c === k - 1 || c === k);
  const hasParents = n > 0 && k > 0 && k < n;

  return (
    <Figure
      title={tx(t, "figPascal_title", "Pascal's triangle")}
      head={<Choice value={mode} onChange={setMode} options={[["sum", tx(t, "figPascal_sum", "addition rule")], ["odd", tx(t, "figPascal_odd", "odd entries")]]} />}
      controls={<>
        <Row>
          <Readout color={C.blue}>{`C(${n}, ${k}) = ${TRI[n][k]}`}</Readout>
          {hasParents && <Readout color={C.amber}>{`= C(${n - 1}, ${k - 1}) + C(${n - 1}, ${k}) = ${TRI[n - 1][k - 1]} + ${TRI[n - 1][k]}`}</Readout>}
          <Readout>{`${tx(t, "figPascal_rowSum", "row sum")} = 2${sup(n)} = ${2 ** n}`}</Readout>
        </Row>
        <Row><Readout>{n <= 7 ? `(a + b)${sup(n)} = ${expansion(n)}` : `(a + b)${sup(n)} = ${expansion(n).split(" + ").slice(0, 4).join(" + ")} + …`}</Readout></Row>
      </>}
      note={<>
        {tx(t, "figPascal_note", "Every entry is the sum of the two above it, and the edges are all 1. Entry k of row n (both counted from 0) is C(n, k); row n lists the coefficients of (a + b)ⁿ and adds up to 2ⁿ, the number of subsets of n items. Each row reads the same forwards and backwards: C(n, k) = C(n, n − k).")}{" "}
        <span data-mouse-only>{tx(t, "figPascal_click", "Click an entry to select it.")}</span>
        <span data-touch-only>{tx(t, "figPascal_tap", "Tap an entry to select it.")}</span>
      </>}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {TRI.map((row, r) => <T key={`l${r}`} x={8} y={cy(r) + 3.5} color={C.axis}>{`n=${r}`}</T>)}
        {TRI.map((row, r) => row.map((v, c) => {
          const sel = r === n && c === k, par = isParent(r, c), odd = mode === "odd" && v % 2 === 1;
          const col = sel ? C.blue : par ? C.amber : odd ? C.purple : null;
          return (
            <g key={`${r}-${c}`} onClick={() => setSel([r, c])} style={{ cursor: "pointer" }}>
              <rect x={cx(r, c) - 19} y={cy(r) - 10} width={38} height={20} rx={6}
                fill={col ?? "var(--surface)"} fillOpacity={col ? 0.28 : 1} stroke={col ?? "var(--border)"} strokeWidth={sel || par ? 1.8 : 1} />
              <T x={cx(r, c)} y={cy(r) + 3.5} anchor="middle" color={col ?? C.fg} bold={sel}>{v}</T>
            </g>
          );
        }))}
      </svg>
    </Figure>
  );
}
