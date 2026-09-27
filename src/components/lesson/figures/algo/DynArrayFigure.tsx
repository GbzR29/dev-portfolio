"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, C, T, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A dynamic array growing one push_back at a time. The row of cells is the
// current block: filled cells are the size, empty ones the spare capacity.
// When a push finds no room, a bigger block is allocated and every element is
// copied over; the bar chart below records the cost of each push (1 write,
// plus the copies when it had to grow). With "double" the tall bars get rarer
// as they get taller, and the average stays under 3; with "+4" they keep
// coming every 4 pushes and the average climbs with n.

type Growth = "double" | "half" | "plus4";
const GROW: Record<Growth, (c: number) => number> = {
  double: c => Math.max(1, c * 2),
  half: c => Math.max(2, Math.ceil(c * 1.5)),
  plus4: c => c + 4,
};
type State = { size: number; cap: number; costs: number[]; copies: number; grew: boolean };
const EMPTY: State = { size: 0, cap: 0, costs: [], copies: 0, grew: false };

function push(s: State, g: Growth): State {
  if (s.size < s.cap) return { ...s, size: s.size + 1, costs: [...s.costs, 1], grew: false };
  return { size: s.size + 1, cap: GROW[g](s.cap), costs: [...s.costs, s.size + 1], copies: s.copies + s.size, grew: true };
}

const W = 560, H = 236, MAXN = 64;

export function DynArrayFigure({ t }: { t?: TrackTranslations }) {
  const [g, setG] = useState<Growth>("double");
  const [s, setS] = useState<State>(EMPTY);
  const pushN = (k: number) => setS(prev => { let x = prev; for (let i = 0; i < k && x.size < MAXN; ++i) x = push(x, g); return x; });
  const reset = (ng = g) => { setG(ng); setS(EMPTY); };

  // Cells: up to 64 of the capacity, in rows of 32
  const cw = 16, cols = 32, x0 = (W - cols * cw) / 2;
  const shownCap = Math.min(s.cap, MAXN + 8);
  const maxCost = Math.max(4, ...s.costs);
  const bw = (W - 40) / MAXN;
  const avg = s.size ? (s.size + s.copies) / s.size : 0;

  return (
    <Figure
      title={tx(t, "figDyn_title", "Growing a dynamic array")}
      head={<Choice value={g} onChange={v => reset(v)} options={[["double", "×2"], ["half", "×1.5"], ["plus4", "+4"]] as const} />}
      controls={<>
        <Row>
          <Btn onClick={() => pushN(1)}>push_back</Btn>
          <Btn onClick={() => pushN(8)}>push_back ×8</Btn>
          <Btn onClick={() => pushN(MAXN)}>{tx(t, "figDyn_fill", "fill to 64")}</Btn>
          <Btn onClick={() => reset()}>↻</Btn>
        </Row>
        <Row>
          <Readout>size = {s.size}</Readout>
          <Readout>capacity = {s.cap}</Readout>
          <Readout color={C.red}>{tx(t, "figDyn_copies", "copies so far")}: {s.copies}</Readout>
          <Readout color={C.green}>{tx(t, "figDyn_avg", "average cost per push")}: {f2(avg)}</Readout>
        </Row>
      </>}
      note={tx(t, "figDyn_note", "Each push_back writes one element. When size reaches capacity, the array allocates a bigger block, copies every element across and frees the old one: that push costs 1 + size. Doubling makes these expensive pushes exponentially rare, so the total work for n pushes stays below 3n, a constant average (amortised O(1)). Growing by a fixed +4 copies the whole array every 4 pushes, and the average grows with n: Θ(n²) in total.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <T x={x0} y={16} size={10} color={s.grew ? C.red : C.fg} bold>
          {s.size === 0 ? tx(t, "figDyn_start", "empty: size 0, capacity 0")
            : s.grew ? `${tx(t, "figDyn_grew", "full: new block of")} ${s.cap}, ${tx(t, "figDyn_copied", "copied")} ${s.size - 1} + ${tx(t, "figDyn_wrote", "wrote 1")}`
            : `${tx(t, "figDyn_room", "room left: wrote 1")}`}
        </T>
        {Array.from({ length: shownCap }, (_, i) => {
          const x = x0 + (i % cols) * cw, y = 28 + Math.floor(i / cols) * 20;
          const filled = i < s.size, last = i === s.size - 1;
          return <rect key={i} x={x + 1} y={y} width={cw - 2} height={16} rx={2}
            fill={filled ? (last ? C.amber : C.sky) : C.bg} fillOpacity={filled ? 0.8 : 1} stroke={C.axis} strokeWidth={0.8} />;
        })}
        <T x={20} y={116} size={8.5}>{tx(t, "figDyn_cost", "cost of each push (writes + copies)")}</T>
        {s.costs.map((c, i) => {
          const h = (86 * c) / maxCost;
          return <rect key={i} x={20 + i * bw + 0.5} y={210 - h} width={Math.max(1, bw - 1)} height={h} fill={c > 1 ? C.red : C.sky} opacity={0.8} />;
        })}
        <rect x={20} y={210} width={W - 40} height={1} fill={C.axis} />
        <T x={20} y={224} size={8}>1</T>
        <T x={W - 20} y={224} size={8} anchor="end">{MAXN}</T>
        <T x={W - 20} y={116} size={8.5} anchor="end">max {maxCost}</T>
      </svg>
    </Figure>
  );
}
