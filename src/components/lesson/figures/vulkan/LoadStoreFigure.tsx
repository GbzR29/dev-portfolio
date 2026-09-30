"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, C, T, f2, hash2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// One frame of rendering into a colour attachment, seen as three pictures:
// the image in memory before the frame (last frame's triangle), the image the
// GPU works on after the load operation and this frame's draw, and the image
// in memory afterwards (what the swapchain presents). loadOp decides what the
// working copy starts from; storeOp decides whether the result is written back.
// The readouts count the memory traffic those two choices cost per frame.

type Load = "LOAD" | "CLEAR" | "DONT_CARE";
type Store = "STORE" | "DONT_CARE";
type Res = "1080" | "2160";

const GW = 24, GH = 16, CELL = 7;
const PW = GW * CELL, PH = GH * CELL, W = 600, H = PH + 64, PY = 30;
const PANELS = [14, 216, 418];
const CLEAR = "#1e2a44", PREV = C.sky, CUR = C.amber;
const RES: Record<Res, [number, number]> = { "1080": [1920, 1080], "2160": [3840, 2160] };

/** Is the cell centre inside the triangle? (cell units) */
function inTri(x: number, y: number, [a, b, c]: [number, number][]) {
  const s = (p: [number, number], q: [number, number]) => (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0]);
  const d1 = s(a, b), d2 = s(b, c), d3 = s(c, a);
  return (d1 >= 0 && d2 >= 0 && d3 >= 0) || (d1 <= 0 && d2 <= 0 && d3 <= 0);
}
const PREV_TRI: [number, number][] = [[5, 2], [11, 13], [1, 13]];
const CUR_TRI: [number, number][] = [[14, 2], [21, 13], [8, 13]];
const garbage = (x: number, y: number, seed: number) => {
  const h = hash2(x >> 1, y, seed);
  return h < 0.3 ? "#3f2a1d" : h < 0.55 ? "#5b1d3a" : h < 0.75 ? "#1d4b3a" : h < 0.9 ? "#6b6b1d" : "#111";
};

type Img = (x: number, y: number) => string;
const before: Img = (x, y) => (inTri(x + 0.5, y + 0.5, PREV_TRI) ? PREV : CLEAR);

export function LoadStoreFigure({ t }: { t?: TrackTranslations }) {
  const [load, setLoad] = useState<Load>("CLEAR");
  const [store, setStore] = useState<Store>("STORE");
  const [res, setRes] = useState<Res>("1080");

  const start: Img = load === "LOAD" ? before : load === "CLEAR" ? () => CLEAR : (x, y) => garbage(x, y, 7);
  const work: Img = (x, y) => (inTri(x + 0.5, y + 0.5, CUR_TRI) ? CUR : start(x, y));
  const after: Img = store === "STORE" ? work : (x, y) => garbage(x, y, 23);

  const [w, h] = RES[res];
  const bytes = w * h * 4;                              // 4 bytes per pixel (B8G8R8A8)
  const mib = (b: number) => b / (1024 * 1024);
  const read = load === "LOAD" ? bytes : 0, write = store === "STORE" ? bytes : 0;

  const panel = (x0: number, img: Img, label: string, sub: string) => (
    <g>
      <T x={x0} y={PY - 16} size={9} bold color={C.fg}>{label}</T>
      <T x={x0} y={PY - 5} size={7.5}>{sub}</T>
      {Array.from({ length: GW * GH }, (_, i) => {
        const x = i % GW, y = (i / GW) | 0;
        return <rect key={i} x={x0 + x * CELL} y={PY + y * CELL} width={CELL} height={CELL} fill={img(x, y)} shapeRendering="crispEdges" />;
      })}
      <rect x={x0} y={PY} width={PW} height={PH} fill="none" stroke={C.axis} />
    </g>
  );

  return (
    <Figure
      title={tx(t, "figVkLoad_title", "loadOp and storeOp")}
      head={<Choice value={res} onChange={setRes} options={[["1080", "1920×1080"], ["2160", "3840×2160"]] as const} />}
      controls={<>
        <Row><span className="text-[10px] font-mono text-[var(--text-muted)] w-16">loadOp</span>
          <Choice value={load} onChange={setLoad} options={[["LOAD", "LOAD"], ["CLEAR", "CLEAR"], ["DONT_CARE", "DONT_CARE"]] as const} /></Row>
        <Row><span className="text-[10px] font-mono text-[var(--text-muted)] w-16">storeOp</span>
          <Choice value={store} onChange={setStore} options={[["STORE", "STORE"], ["DONT_CARE", "DONT_CARE"]] as const} /></Row>
        <Row>
          <Readout>{tx(t, "figVkLoad_read", "read")} {f2(mib(read), 1)} MiB</Readout>
          <Readout>{tx(t, "figVkLoad_write", "written")} {f2(mib(write), 1)} MiB</Readout>
          <Readout>× 60 fps = {f2(mib(read + write) * 60 / 1024, 2)} GiB/s</Readout>
        </Row>
      </>}
      note={tx(t, "figVkLoad_note", "The blue triangle is last frame's picture, the amber one is this frame's draw, which covers only part of the image. LOAD reads the old contents first, so the old triangle stays behind this one (useful only when you really add to an existing picture). CLEAR fills the image with the clear colour without reading anything. DONT_CARE promises you will overwrite every pixel, so the GPU may start from anything: here it did not, and the garbage shows. STORE writes the result to memory; DONT_CARE throws it away, which is right for attachments nobody reads later (a depth buffer, for instance), and wrong for the swapchain image the screen is about to show. On tile-based GPUs (phones, Apple silicon) the image lives in fast on-chip memory during rendering, so every avoided load or store is memory traffic, and power, saved.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        {panel(PANELS[0], before, tx(t, "figVkLoad_before", "memory, before"), tx(t, "figVkLoad_beforeSub", "last frame's picture"))}
        {panel(PANELS[1], work, tx(t, "figVkLoad_work", "while rendering"), tx(t, "figVkLoad_workSub", "after loadOp + draw"))}
        {panel(PANELS[2], after, tx(t, "figVkLoad_after", "memory, after"), tx(t, "figVkLoad_afterSub", "what gets presented"))}
        <T x={PANELS[1] - 6} y={PY + PH / 2} size={11} anchor="end" color={C.fg}>→</T>
        <T x={PANELS[2] - 6} y={PY + PH / 2} size={11} anchor="end" color={C.fg}>→</T>
        <T x={PANELS[1]} y={PY + PH + 16} size={8.5} color={load === "LOAD" ? C.amber : C.muted}>loadOp = {load}</T>
        <T x={PANELS[2]} y={PY + PH + 16} size={8.5} color={store === "STORE" ? C.muted : C.red}>storeOp = {store}</T>
        {store === "DONT_CARE" && <T x={PANELS[2]} y={PY + PH + 30} size={8.5} color={C.red}>{tx(t, "figVkLoad_lost", "the frame is lost")}</T>}
      </svg>
    </Figure>
  );
}
