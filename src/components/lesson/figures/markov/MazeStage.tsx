"use client";

import { C, T } from "@/components/lesson/kit/figure";
import { EDGES, NAMES, ROOMS } from "./mazeModel";

// ── The maze: rooms, doors, a mouse and the cheese ────────────────────────────
// Left: the 3 × 3 rooms. Each inner wall is drawn solid when closed and with a
// gap (the door) when open; clicking a wall opens or closes it. Every room
// shows its exact value (expected moves to the cheese, or expected visits) on
// a tint that grows with it, and the simulated average under it once mice have
// run. The chosen room gets arrows through its doors, each labelled with the
// chance 1/(number of doors). Right: the first-step equation of that room.

export const STAGE_W = 660;
const H = 370, GX = 20, GY = 20, R = 110, WALL = 4, GAP = 40, PANEL_X = 375;

export type Mode = "time" | "visits";

/** Centre of a room in viewBox units. */
export const roomXY = (r: number) => ({ x: GX + (r % 3) * R + R / 2, y: GY + Math.floor(r / 3) * R + R / 2 });

/** The wall segment between two adjacent rooms. */
function wallOf(a: number, b: number) {
  const pa = roomXY(a);
  if (b === a + 1) { const x = pa.x + R / 2; return { x1: x, y1: pa.y - R / 2, x2: x, y2: pa.y + R / 2 }; }
  const y = pa.y + R / 2;
  return { x1: pa.x - R / 2, y1: y, x2: pa.x + R / 2, y2: y };
}

function Cheese({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x - 22},${y - 14})`} pointerEvents="none">
      <path d="M0,28 L44,28 L44,10 L6,0 Z" fill={C.amber} stroke="#b45309" strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={14} cy={18} r={3.5} fill="#b45309" opacity={0.55} />
      <circle cx={30} cy={14} r={2.6} fill="#b45309" opacity={0.55} />
      <circle cx={34} cy={23} r={2.2} fill="#b45309" opacity={0.55} />
    </g>
  );
}

function Mouse({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`} pointerEvents="none">
      <path d="M9,3 C18,6 20,14 14,16" fill="none" stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" />
      <ellipse cx={0} cy={0} rx={11} ry={8.5} fill="#9ca3af" stroke="#4b5563" strokeWidth={1.2} />
      <circle cx={-6} cy={-8} r={4.5} fill="#d1d5db" stroke="#4b5563" strokeWidth={1.2} />
      <circle cx={5} cy={-8} r={4.5} fill="#d1d5db" stroke="#4b5563" strokeWidth={1.2} />
      <circle cx={-4} cy={-1} r={1.4} fill="#111827" />
      <circle cx={3} cy={-1} r={1.4} fill="#111827" />
      <circle cx={-0.5} cy={3.5} r={1.6} fill={C.pink} />
    </g>
  );
}

export function MazeStage({ doors, nb, cheese, start, mode, values, sim, focus, mouse, onDoor, onRoom, lines, labels }: {
  doors: readonly boolean[];
  nb: number[][];
  cheese: number;
  start: number;
  mode: Mode;
  /** Exact value per room as text, with its size for the tint; null = never reaches the cheese. */
  values: ({ text: string; num: number } | null)[];
  /** Simulated averages per room, once mice have run (NaN where there is none). */
  sim: number[] | null;
  focus: number | null;
  /** The mouse, between two room centres. */
  mouse: { x: number; y: number } | null;
  onDoor: (e: number) => void;
  onRoom: (r: number) => void;
  /** The panel on the right: a heading and the equation lines of the chosen room. */
  lines: string[];
  labels: { start: string; heading: string; sim: string; never: string };
}) {
  const col = mode === "time" ? C.purple : C.teal;
  // Tint from the smallest to the largest value among the rooms without cheese
  const nums = values.filter((v, r) => v && r !== cheese).map(v => v!.num);
  const lo = nums.length ? Math.min(...nums) : 0, hi = nums.length ? Math.max(...nums) : 1;
  const tint = (x: number) => 0.1 + 0.4 * (hi - lo > 1e-9 ? (x - lo) / (hi - lo) : 1);

  return (
    <svg viewBox={`0 0 ${STAGE_W} ${H}`} className="w-full block">
      {/* Rooms */}
      {Array.from({ length: ROOMS }, (_, r) => {
        const { x, y } = roomXY(r);
        const v = values[r];
        const on = r === focus;
        return (
          <g key={r} onClick={() => onRoom(r)} style={{ cursor: "pointer" }}>
            <rect x={x - R / 2} y={y - R / 2} width={R} height={R} fill="var(--card)" />
            {r !== cheese && v && <rect x={x - R / 2} y={y - R / 2} width={R} height={R} fill={col} opacity={tint(v.num)} />}
            {r !== cheese && !v && <rect x={x - R / 2} y={y - R / 2} width={R} height={R} fill={C.red} opacity={0.12} />}
            {on && <rect x={x - R / 2 + 5} y={y - R / 2 + 5} width={R - 10} height={R - 10} rx={6} fill="none" stroke={C.amber} strokeWidth={2.2} />}
            <T x={x - R / 2 + 10} y={y - R / 2 + 19} size={13} bold color={C.fg}>{NAMES[r]}</T>
            {r === cheese
              ? <Cheese x={x} y={y + 6} />
              : <T x={x} y={y + 8} anchor="middle" size={v && v.text.length > 6 ? 14 : 19} bold color={C.fg}>{v ? v.text : "∞"}</T>}
            {r !== cheese && sim && v && Number.isFinite(sim[r]) && (
              <T x={x} y={y + 27} anchor="middle" size={10} color={C.amber}>{labels.sim} {sim[r].toFixed(2)}</T>
            )}
            {r === start && (
              <T x={x + R / 2 - 9} y={y + R / 2 - 9} anchor="end" size={9.5} bold color={C.green}>{labels.start}</T>
            )}
          </g>
        );
      })}

      {/* Arrows from the chosen room through its doors */}
      {focus !== null && focus !== cheese && nb[focus].map(n => {
        const a = roomXY(focus), b = roomXY(n);
        const dx = Math.sign(b.x - a.x), dy = Math.sign(b.y - a.y);
        const sx = a.x + dx * 26, sy = a.y + dy * 26, ex = a.x + dx * (R / 2 + 16), ey = a.y + dy * (R / 2 + 16);
        const hx = -dy * 5, hy = dx * 5;
        return (
          <g key={n} pointerEvents="none">
            <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={C.amber} strokeWidth={2} />
            <path d={`M${ex + hx - dx * 7},${ey + hy - dy * 7} L${ex},${ey} L${ex - hx - dx * 7},${ey - hy - dy * 7}`} fill="none" stroke={C.amber} strokeWidth={2} />
            <T x={a.x + dx * 36 + (dy ? 7 : 0)} y={a.y + dy * 36 + (dx ? -7 : 4)} anchor={dy ? "start" : "middle"} size={10} bold color={C.amber}>
              {`1/${nb[focus].length}`}
            </T>
          </g>
        );
      })}

      {/* Walls and doors; each inner wall is a button */}
      <rect x={GX} y={GY} width={3 * R} height={3 * R} fill="none" stroke={C.fg} strokeWidth={WALL} />
      {EDGES.map(([a, b], e) => {
        const w = wallOf(a, b);
        const vertical = w.x1 === w.x2;
        const mid = { x: (w.x1 + w.x2) / 2, y: (w.y1 + w.y2) / 2 };
        const open = doors[e];
        return (
          <g key={e} onClick={() => onDoor(e)} style={{ cursor: "pointer" }}>
            <rect x={vertical ? w.x1 - 9 : w.x1 + 8} y={vertical ? w.y1 + 8 : w.y1 - 9}
              width={vertical ? 18 : R - 16} height={vertical ? R - 16 : 18} fill="transparent" />
            {open ? (
              <>
                <line x1={w.x1} y1={w.y1} x2={vertical ? w.x1 : mid.x - GAP / 2} y2={vertical ? mid.y - GAP / 2 : w.y1} stroke={C.fg} strokeWidth={WALL} strokeLinecap="round" />
                <line x1={vertical ? w.x1 : mid.x + GAP / 2} y1={vertical ? mid.y + GAP / 2 : w.y1} x2={w.x2} y2={w.y2} stroke={C.fg} strokeWidth={WALL} strokeLinecap="round" />
              </>
            ) : (
              <line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke={C.fg} strokeWidth={WALL} strokeLinecap="round" />
            )}
          </g>
        );
      })}

      {mouse && <Mouse x={mouse.x} y={mouse.y} />}

      {/* Panel */}
      <T x={PANEL_X} y={GY + 12} size={10} bold color={C.muted}>{labels.heading}</T>
      {lines.map((l, i) => (
        <T key={i} x={PANEL_X} y={GY + 40 + i * 22} size={12} color={i === lines.length - 1 && lines.length > 1 ? C.fg : C.muted} bold={i === lines.length - 1 && lines.length > 1}>{l}</T>
      ))}
      {values.some((v, r) => !v && r !== cheese) && (
        <T x={PANEL_X} y={H - 16} size={10} color={C.red}>{labels.never}</T>
      )}
    </svg>
  );
}
