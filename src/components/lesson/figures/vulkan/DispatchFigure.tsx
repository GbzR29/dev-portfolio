"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, Slider, Sliders, C, T, svgPoint } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A compute dispatch over a W × H image. Every cell is one invocation; thick
// outlines are workgroups of local_size_x × local_size_y invocations, and the
// dispatch launches ceil(W / lx) × ceil(H / ly) of them. Invocations past the
// image's edge still run (hatched) and must return early. Pointing at a cell
// shows its built-in IDs and highlights the subgroup (32 invocations that
// execute in lockstep on this GPU) it belongs to.

type Local = "4x4" | "8x8" | "16x16" | "32x1";
const SIZES: Record<Local, [number, number]> = { "4x4": [4, 4], "8x8": [8, 8], "16x16": [16, 16], "32x1": [32, 1] };
const SUBGROUP = 32, VW = 640, VH = 300, PAD = 8;

export function DispatchFigure({ t }: { t?: TrackTranslations }) {
  const [w, setW] = useState(37);
  const [h, setH] = useState(21);
  const [local, setLocal] = useState<Local>("8x8");
  const [probe, setProbe] = useState<[number, number] | null>([12, 9]);
  const L = (k: string, en: string) => tx(t, `figVkDisp_${k}`, en);

  const [lx, ly] = SIZES[local];
  const gx = Math.ceil(w / lx), gy = Math.ceil(h / ly);
  const tw = gx * lx, th = gy * ly;                                   // invocations launched, per axis
  const cell = Math.min((VW - 2 * PAD) / tw, (VH - 2 * PAD - 14) / th);
  const ox = (VW - tw * cell) / 2, oy = PAD;
  const launched = tw * th, idle = launched - w * h;

  const ids = probe && probe[0] < tw && probe[1] < th ? (() => {
    const [x, y] = probe;
    const wg = [Math.floor(x / lx), Math.floor(y / ly)], li = [x % lx, y % ly];
    const index = li[1] * lx + li[0];                                 // gl_LocalInvocationIndex
    return { x, y, wg, li, index, sub: Math.floor(index / SUBGROUP), inside: x < w && y < h };
  })() : null;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const p = svgPoint(e.currentTarget, e);
    const x = Math.floor((p.x - ox) / cell), y = Math.floor((p.y - oy) / cell);
    if (x >= 0 && y >= 0 && x < tw && y < th) setProbe([x, y]);
  };

  const cells = [];
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
    const inside = x < w && y < h;
    const sameGroup = ids && Math.floor(x / lx) === ids.wg[0] && Math.floor(y / ly) === ids.wg[1];
    const sameSub = sameGroup && Math.floor(((y % ly) * lx + (x % lx)) / SUBGROUP) === ids!.sub;
    const fill = sameSub ? C.amber : inside ? C.sky : "#64748b";
    const op = sameSub ? 0.75 : sameGroup ? 0.5 : inside ? 0.28 : 0.12;
    cells.push(<rect key={`${x},${y}`} x={ox + x * cell + 0.4} y={oy + y * cell + 0.4} width={cell - 0.8} height={cell - 0.8} fill={fill} fillOpacity={op} />);
  }
  const groups = [];
  for (let j = 0; j < gy; j++) for (let i = 0; i < gx; i++)
    groups.push(<rect key={`g${i},${j}`} x={ox + i * lx * cell} y={oy + j * ly * cell} width={lx * cell} height={ly * cell} fill="none" stroke={C.fg} strokeOpacity={0.55} strokeWidth={1.2} />);

  return (
    <Figure
      title={L("title", "A dispatch: workgroups, invocations, subgroups")}
      head={<>
        <span className="text-[10px] font-mono text-[var(--text-muted)] self-center">local_size</span>
        <Choice value={local} onChange={setLocal} options={[["4x4", "4×4"], ["8x8", "8×8"], ["16x16", "16×16"], ["32x1", "32×1"]] as const} />
      </>}
      controls={<>
        <Sliders>
          <Slider label={L("width", "image width")} value={w} min={4} max={48} step={1} onChange={setW} fmt={v => `${v} px`} />
          <Slider label={L("height", "image height")} value={h} min={4} max={32} step={1} onChange={setH} fmt={v => `${v} px`} />
        </Sliders>
        <Row>
          <Readout color={C.sky}>vkCmdDispatch({gx}, {gy}, 1)</Readout>
          <Readout>{L("launched", "invocations")} {launched}</Readout>
          <Readout color={idle ? C.amber : C.green}>{L("idle", "past the edge")} {idle} ({((idle / launched) * 100).toFixed(0)}%)</Readout>
          <Readout>{L("subs", "subgroups per workgroup")} {Math.ceil((lx * ly) / SUBGROUP)}</Readout>
        </Row>
        {ids && (
          <Row>
            <Readout>gl_WorkGroupID = ({ids.wg[0]}, {ids.wg[1]}, 0)</Readout>
            <Readout>gl_LocalInvocationID = ({ids.li[0]}, {ids.li[1]}, 0)</Readout>
            <Readout color={ids.inside ? C.fg : C.amber}>gl_GlobalInvocationID = ({ids.x}, {ids.y}, 0){ids.inside ? "" : ` → ${L("ret", "returns early")}`}</Readout>
            <Readout>gl_LocalInvocationIndex = {ids.index}</Readout>
            <Readout color={C.amber}>{L("subgroup", "subgroup")} {ids.sub}</Readout>
          </Row>
        )}
      </>}
      note={L("note", "Each cell is one invocation of the compute shader; the image covers the blue ones. The dispatch counts workgroups, not invocations, so it rounds up, and a workgroup hanging over the right or bottom edge still runs all of its invocations: the grey ones must check gl_GlobalInvocationID against the image size and return. The GPU executes a workgroup as subgroups (warps) of 32 invocations in lockstep, highlighted for the cell under the pointer; a workgroup of 16 invocations (4 × 4) leaves half of every subgroup empty, which is why 64 or 256 invocations per workgroup are the usual choices. 32 × 1 fills one subgroup exactly but makes long, thin tiles: up to 31 wasted columns at the right edge, and neighbouring invocations that touch a less compact patch of a 2D image.")}
    >
      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-auto touch-none" role="img" onPointerMove={onMove} onPointerDown={onMove}>
        {cells}
        {groups}
        <rect x={ox} y={oy} width={w * cell} height={h * cell} fill="none" stroke={C.sky} strokeWidth={2} />
        <T x={ox} y={oy + th * cell + 11} size={8}>{L("image", "image")} {w} × {h} · {L("workgroups", "workgroups")} {gx} × {gy} · {lx} × {ly} {L("each", "invocations each")}</T>
      </svg>
    </Figure>
  );
}
