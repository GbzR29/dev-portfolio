"use client";

import { C, T, f2, nearest, useDrag, type Pt } from "@/components/lesson/kit/figure";

// ── A 3-state chain you can edit ──────────────────────────────────────────────
// Left: the chain as a graph. Arrow widths follow the probabilities, and each
// circle grows with its stationary probability π(j) when there is one.
// Right: the matrix as three bars, one per row. A bar is the row's total
// probability, cut into pieces for "to 0", "to 1", "to 2"; dragging a divider
// moves probability between two neighbouring pieces, so the row still adds up
// to 1. In "free" mode every piece's end can be dragged on its own, which can
// break that rule. Bottom: πₙ over 20 steps from a fixed start, with the total
// probability as a dashed line (it must stay at 1).

export const STAGE_W = 660;
const H = 340;
export const STATE_COLS = [C.amber, C.purple, C.sky];
const NODES: [number, number][] = [[95, 206], [180, 90], [265, 206]];
const CENTER: [number, number] = [180, 167];
const X0 = 420, U = 180, ROW_Y = [62, 122, 182], BAR_H = 24;
const PLOT_T = 262, PLOT_H = 58, PLOT_X0 = 40, PLOT_X1 = STAGE_W - 20, N_PLOT = 20;
/** In free mode a row may hold up to 1.3. */
export const FREE_MAX = 26;

export type Handle = { r: number; d: number };

export function StationaryStage({ M, free, pi, names, dists, onDrag }: {
  /** Entries in twentieths: M[i][j] / 20 = p_ij. */
  M: number[][];
  free: boolean;
  pi: number[] | null;
  names: string[];
  /** π₀ … π₂₀ in numbers (may stop adding up to 1 in free mode). */
  dists: number[][];
  /** A divider (normal) or a piece's end (free) moved: handle d of row r to cumulative value v (twentieths). */
  onDrag: (h: Handle, v: number) => void;
}) {
  // ── Handles (picked from the latest render's positions) ──
  const drag = useDrag<Handle>(p => nearest(p, handles, 16), (h, p) => onDrag(h, Math.round(((p.x - X0) / U) * 20)));
  const active = drag.dragging;
  const cum = M.map(r => [r[0], r[0] + r[1], r[0] + r[1] + r[2]]);
  const hx = (v: number) => X0 + (v / 20) * U;
  const handles = [0, 1, 2].flatMap(r => (free ? [0, 1, 2] : [0, 1]).map((d): [Handle, Pt] =>
    [{ r, d }, { x: hx(cum[r][d]), y: ROW_Y[r] + BAR_H / 2 }]));

  const arrows = [0, 1, 2].flatMap(a => [0, 1, 2].map(b => <Arrow key={`${a}${b}`} a={a} b={b} p={M[a][b] / 20} pi={pi} />));

  // ── Plot ──
  const px = (s: number) => PLOT_X0 + (s * (PLOT_X1 - PLOT_X0)) / N_PLOT;
  const top = Math.max(1, ...dists.map(d => d.reduce((a, b) => a + b, 0)));
  const py = (v: number) => PLOT_T + PLOT_H - (Math.min(v, top) / top) * PLOT_H;
  const totals = dists.map(d => d.reduce((a, b) => a + b, 0));

  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${STAGE_W} ${H}`} className="w-full block"
      style={{ ...drag.handlers.style, cursor: active ? "grabbing" : undefined }}>
      <defs>
        {STATE_COLS.map((c, i) => (
          <marker key={i} id={`mkSt${i}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={c} />
          </marker>
        ))}
      </defs>

      {arrows}
      {NODES.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={nodeR(pi, i)} fill="var(--card)" stroke={STATE_COLS[i]} strokeWidth={2.2} />
          <T x={x} y={y + 1} anchor="middle" size={12} bold color={C.fg}>{i}</T>
          {pi && <T x={x} y={y + 13} anchor="middle" size={9} color={STATE_COLS[i]}>{f2(pi[i], 3)}</T>}
        </g>
      ))}

      {/* The matrix, one bar per row */}
      {M.map((row, r) => {
        const sum = row[0] + row[1] + row[2];
        let x = X0;
        return (
          <g key={r}>
            <T x={X0 - 10} y={ROW_Y[r] + 16} anchor="end" size={10.5} color={C.fg}>{`${r} ${names[r]}`}</T>
            <rect x={X0} y={ROW_Y[r]} width={U} height={BAR_H} fill="none" stroke={C.axis} strokeDasharray="3 3" />
            {row.map((v, j) => {
              const w = (v / 20) * U, x0 = x;
              x += w;
              return (
                <g key={j}>
                  <rect x={x0} y={ROW_Y[r]} width={w} height={BAR_H} fill={STATE_COLS[j]} opacity={0.75} stroke="var(--code-bg)" strokeWidth={1.5} />
                  {w > 26 && <T x={x0 + w / 2} y={ROW_Y[r] + 16} anchor="middle" size={10} color="#1f1300">{dec(v)}</T>}
                </g>
              );
            })}
            {free && sum !== 20 && <T x={Math.min(hx(sum), STAGE_W - 6)} y={ROW_Y[r] - 5} anchor="end" size={10} bold color={C.red}>Σ = {f2(sum / 20, 2)}</T>}
          </g>
        );
      })}
      <line x1={hx(20)} x2={hx(20)} y1={ROW_Y[0] - 12} y2={ROW_Y[2] + BAR_H + 6} stroke={C.fg} strokeWidth={1} opacity={0.5} />
      <T x={hx(20)} y={ROW_Y[0] - 16} anchor="middle" size={9}>1</T>
      <T x={X0} y={ROW_Y[0] - 16} anchor="middle" size={9}>0</T>
      {[0, 1, 2].map(j => (
        <g key={j}>
          <rect x={X0 + j * 64} y={ROW_Y[2] + 38} width={10} height={10} fill={STATE_COLS[j]} opacity={0.75} />
          <T x={X0 + j * 64 + 14} y={ROW_Y[2] + 47} size={9.5}>→ {j}</T>
        </g>
      ))}
      {handles.map(([h, p]) => {
        const on = active !== null && active.r === h.r && active.d === h.d;
        return (
          <g key={`${h.r}-${h.d}`} pointerEvents="none">
            <rect x={p.x - 4} y={p.y - 17} width={8} height={34} rx={4} fill={on ? C.fg : "var(--card)"} stroke={C.fg} strokeWidth={1.4} />
          </g>
        );
      })}

      {/* πₙ over time from the first state, and the total */}
      <line x1={PLOT_X0} x2={PLOT_X1} y1={py(0)} y2={py(0)} stroke={C.axis} />
      <T x={PLOT_X0 - 6} y={py(1) + 4} anchor="end" size={8.5}>1</T>
      <T x={PLOT_X0 - 6} y={py(0) + 4} anchor="end" size={8.5}>0</T>
      {pi && [0, 1, 2].map(j => (
        <line key={`pi${j}`} x1={PLOT_X0} x2={PLOT_X1} y1={py(pi[j])} y2={py(pi[j])} stroke={STATE_COLS[j]} strokeWidth={1} strokeDasharray="2 4" opacity={0.7} />
      ))}
      {[0, 1, 2].map(j => (
        <polyline key={j} fill="none" stroke={STATE_COLS[j]} strokeWidth={1.7} strokeLinejoin="round"
          points={dists.map((d, s) => `${px(s)},${py(d[j])}`).join(" ")} />
      ))}
      {free && <polyline fill="none" stroke={C.red} strokeWidth={1.5} strokeDasharray="5 3" points={totals.map((v, s) => `${px(s)},${py(v)}`).join(" ")} />}
      <T x={PLOT_X1} y={PLOT_T + PLOT_H + 14} anchor="end" size={9}>n = {N_PLOT}</T>
      <T x={PLOT_X0} y={PLOT_T + PLOT_H + 14} size={9}>n = 0</T>
    </svg>
  );
}

/** An entry in twentieths as a short decimal: 14 → "0.7", 7 → "0.35". */
export const dec = (v: number) => String(+(v / 20).toFixed(2));

function nodeR(pi: number[] | null, i: number) {
  return pi ? 17 + 18 * Math.sqrt(pi[i]) : 22;
}

// ── Arrows ────────────────────────────────────────────────────────────────────

/** The arrow a → b, as wide as its probability; a loop on the outside of the triangle when a = b. */
function Arrow({ a, b, p, pi }: { a: number; b: number; p: number; pi: number[] | null }) {
  if (p <= 0) return null;
  const col = STATE_COLS[b];
  const stroke = { fill: "none", stroke: col, strokeWidth: 1 + 5 * p, opacity: 0.8, markerEnd: `url(#mkSt${b})` };
  if (a === b) {
    const [x, y] = NODES[a];
    const ox = x - CENTER[0], oy = y - CENTER[1], L = Math.hypot(ox, oy);
    const ux = ox / L, uy = oy / L, nx = -uy, ny = ux;
    const r = nodeR(pi, a);
    const s = [x + ux * r + nx * 9, y + uy * r + ny * 9], e = [x + ux * r - nx * 9, y + uy * r - ny * 9];
    const c1 = [s[0] + ux * 40 + nx * 22, s[1] + uy * 40 + ny * 22], c2 = [e[0] + ux * 40 - nx * 22, e[1] + uy * 40 - ny * 22];
    return (
      <g>
        <path d={`M${s[0]},${s[1]} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${e[0]},${e[1]}`} {...stroke} />
        <T x={x + ux * (r + 44)} y={y + uy * (r + 44) + 4} anchor="middle" size={10} color={col}>{dec(p * 20)}</T>
      </g>
    );
  }
  const [x1, y1] = NODES[a], [x2, y2] = NODES[b];
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L, nx = uy, ny = -ux;          // bend to the left of the direction of travel
  const r1 = nodeR(pi, a) + 3, r2 = nodeR(pi, b) + 6;
  const s = [x1 + ux * r1 + nx * 7, y1 + uy * r1 + ny * 7], e = [x2 - ux * r2 + nx * 7, y2 - uy * r2 + ny * 7];
  const c = [(x1 + x2) / 2 + nx * 22, (y1 + y2) / 2 + ny * 22];
  return (
    <g>
      <path d={`M${s[0]},${s[1]} Q${c[0]},${c[1]} ${e[0]},${e[1]}`} {...stroke} />
      <T x={c[0] + nx * 8} y={c[1] + ny * 8 + 4} anchor="middle" size={10} color={col}>{dec(p * 20)}</T>
    </g>
  );
}
