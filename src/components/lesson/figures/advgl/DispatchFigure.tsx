"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, Slider, Sliders, C, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A compute dispatch over a small image. Every cell is one invocation; thick
// lines separate work groups. The dispatch size is rounded up,
//   groups = ((W + lx − 1) / lx, (H + ly − 1) / ly),
// so the last column and row of groups run past the image: those invocations
// (hatched) hit the bounds check and return. Tap a cell to see its built-in
// IDs and how gl_GlobalInvocationID is assembled from the other two. Row 0
// is at the bottom, as in OpenGL image coordinates.

const LOCAL = { "4x4": [4, 4], "8x4": [8, 4], "8x8": [8, 8], "16x4": [16, 4] } as const;
type Local = keyof typeof LOCAL;
const W = 620;

export function DispatchFigure({ t }: { t?: TrackTranslations }) {
  const L = (k: string, en: string) => tx(t, `figDispatch_${k}`, en);
  const [w, setW] = useState(37);
  const [h, setH] = useState(21);
  const [loc, setLoc] = useState<Local>("8x8");
  const [sel, setSel] = useState<[number, number]>([33, 18]);
  const [lx, ly] = LOCAL[loc];
  const gx = Math.ceil(w / lx), gy = Math.ceil(h / ly);
  const cols = gx * lx, rows = gy * ly;
  const cell = Math.min(10, (W - 8) / cols);
  const H = rows * cell + 8;
  const ox = (W - 8 - cols * cell) / 2;                // centre the grid
  const total = cols * rows, idle = total - w * h;
  const sx = Math.min(sel[0], cols - 1), sy = Math.min(sel[1], rows - 1);
  const group = lx * ly;
  const inside = sx < w && sy < h;

  return (
    <Figure
      title={L("title", "A dispatch: work groups, invocations and the overhang")}
      head={<Choice value={loc} onChange={setLoc} options={(Object.keys(LOCAL) as Local[]).map(k => [k, k.replace("x", "×")] as const)} />}
      controls={<>
        <Sliders>
          <Slider label={L("w", "image width")} value={w} min={4} max={40} step={1} onChange={setW} fmt={v => `${v}`} />
          <Slider label={L("h", "image height")} value={h} min={4} max={24} step={1} onChange={setH} fmt={v => `${v}`} />
        </Sliders>
        <Row>
          <Readout>glDispatchCompute({gx}, {gy}, 1)</Readout>
          <Readout>{L("inv", "invocations")} {gx}·{gy}·{group} = {total}</Readout>
          <Readout color={idle ? C.amber : C.green}>{L("idle", "out of bounds")} {idle} ({f2((idle * 100) / total, 1)}%)</Readout>
          <Readout>{L("waves", "per group")}: {group} = {group >= 32 ? `${group / 32}×32` : `${f2(group / 32, 2)}×32`} · {group >= 64 ? `${group / 64}×64` : `${f2(group / 64, 2)}×64`}</Readout>
        </Row>
        <Row>
          <Readout color={C.sky}>gl_WorkGroupID ({Math.floor(sx / lx)}, {Math.floor(sy / ly)})</Readout>
          <Readout color={C.purple}>gl_LocalInvocationID ({sx % lx}, {sy % ly})</Readout>
          <Readout color={inside ? C.green : C.red}>gl_GlobalInvocationID ({Math.floor(sx / lx)}·{lx}+{sx % lx}, {Math.floor(sy / ly)}·{ly}+{sy % ly}) = ({sx}, {sy}) {inside ? "" : `→ ${L("ret", "return")}`}</Readout>
          <Readout>gl_LocalInvocationIndex {(sy % ly) * lx + (sx % lx)}</Readout>
        </Row>
      </>}
      note={L("note", "Each group runs together on one compute unit, and its size is fixed in the shader with local_size; you choose only how many groups to launch. Integer division rounds down, so (W + lx − 1) / lx is the usual way to round up: 37 pixels in groups of 8 need 5 groups (40 invocations), and the last 3 columns have nothing to do. On a small image the overhang is a large fraction; at 1921 × 1080 with 16 × 16 groups it is about 1.5%. gl_LocalInvocationIndex flattens the local ID (y · lx + x) and is the natural index into shared memory. A group of 16 (4×4) fills only half of a 32-wide wave and a quarter of a 64-wide one: the rest of the hardware lanes idle.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <defs>
          <pattern id="dispatch-hatch" width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={5} stroke={C.red} strokeWidth={1.4} opacity={0.6} />
          </pattern>
        </defs>
        <g transform={`translate(${ox} 0)`}>
        {Array.from({ length: rows }, (_, y) => Array.from({ length: cols }, (_, x) => {
          const inImg = x < w && y < h;
          const g = Math.floor(x / lx) + Math.floor(y / ly);
          return <rect key={`${x},${y}`} x={4 + x * cell} y={4 + (rows - 1 - y) * cell} width={cell - 1} height={cell - 1}
            fill={inImg ? (g % 2 ? C.sky : C.teal) : "url(#dispatch-hatch)"} fillOpacity={inImg ? 0.45 : 1}
            stroke={x === sx && y === sy ? C.fg : "none"} strokeWidth={2}
            onClick={() => setSel([x, y])} style={{ cursor: "pointer" }} />;
        }))}
        {Array.from({ length: gx + 1 }, (_, i) => <line key={`gx${i}`} x1={4 + i * lx * cell - 0.5} x2={4 + i * lx * cell - 0.5} y1={4} y2={4 + rows * cell} stroke={C.fg} strokeWidth={1.5} />)}
        {Array.from({ length: gy + 1 }, (_, i) => <line key={`gy${i}`} x1={4} x2={4 + cols * cell} y1={4 + i * ly * cell - 0.5} y2={4 + i * ly * cell - 0.5} stroke={C.fg} strokeWidth={1.5} />)}
        <rect x={4} y={4 + (rows - h) * cell} width={w * cell - 1} height={h * cell - 1} fill="none" stroke={C.amber} strokeWidth={2} strokeDasharray="5 3" />
        </g>
      </svg>
    </Figure>
  );
}
