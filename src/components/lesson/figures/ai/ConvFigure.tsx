"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Readout, Row, C, T, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { conv2d, outSize, type Img } from "./cnn";

// ── What this figure shows ────────────────────────────────────────────────────
// A 3×3 kernel sliding over an 8×8 image, one output pixel per step. The window
// in the input, the 9 weights, and the products that add up to the current
// output are all drawn; the feature map fills in as the window moves. Padding
// adds a ring of zeros (dashed cells) and stride skips positions, so the
// output size follows (n + 2p − k)/s + 1. Clicking input pixels draws on the
// image; clicking an output pixel jumps the window there.

const NI = 8;
const KERNELS = {
  vert:  [-1, 0, 1, -1, 0, 1, -1, 0, 1],
  horiz: [-1, -1, -1, 0, 0, 0, 1, 1, 1],
  blur:  Array(9).fill(1 / 9),
  sharp: [0, -1, 0, -1, 5, -1, 0, -1, 0],
  ident: [0, 0, 0, 0, 1, 0, 0, 0, 0],
} as const;
type KName = keyof typeof KERNELS;

function preset(name: "square" | "edge" | "seven"): Float64Array {
  const px = new Float64Array(NI * NI);
  for (let r = 0; r < NI; r++) for (let c = 0; c < NI; c++) {
    const on = name === "square" ? r >= 2 && r <= 5 && c >= 2 && c <= 5
      : name === "edge" ? c >= 4
      : (r === 1 && c >= 1 && c <= 6) || (r >= 2 && c === 7 - r + 1 && c >= 2);
    px[r * NI + c] = on ? 1 : 0;
  }
  return px;
}

const CELL = 22, KC = 30;
const PAD_X = 16, TOP = 26;
const fmtW = (w: number) => (Math.abs(w - 1 / 9) < 1e-9 ? "1/9" : String(w));

/** A diverging colour for a feature-map value: teal for positive, red for negative. */
function heat(v: number, max: number) {
  const a = max > 0 ? Math.min(1, Math.abs(v) / max) : 0;
  return { fill: v >= 0 ? C.teal : C.red, opacity: 0.08 + 0.85 * a };
}

export function ConvFigure({ t }: { t?: TrackTranslations }) {
  const [img, setImg] = useState<Float64Array>(() => preset("square"));
  const [kname, setK] = useState<KName>("vert");
  const [pad, setPad] = useState<"0" | "1">("0");
  const [stride, setStride] = useState<"1" | "2">("1");
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const acc = useRef(0);
  const vis = useVisible<HTMLDivElement>();
  const L = (k: string, en: string) => tx(t, `figAiConv_${k}`, en);

  const p = Number(pad), s = Number(stride);
  const m = outSize(NI, 3, p, s), total = m * m;
  const w = KERNELS[kname];
  const out: Img = conv2d({ n: NI, px: img }, w, 3, 0, p, s);
  const maxAbs = out.px.reduce((a, v) => Math.max(a, Math.abs(v)), 0);
  const cur = Math.min(pos, total - 1);
  const orow = Math.floor(cur / m), ocol = cur % m;
  const wy = orow * s - p, wx = ocol * s - p;                     // top-left of the window, in image coordinates

  useFrame(playing && vis.on, dt => {
    acc.current += dt;
    if (acc.current < 0.45) return;
    acc.current = 0;
    setPos(q => { if (q + 1 >= total) { setPlaying(false); return q; } return q + 1; });
  });

  const change = <V,>(set: (v: V) => void) => (v: V) => { set(v); setPos(0); setPlaying(false); };

  // Layout: input (with its padding ring), kernel, output.
  const inN = NI + 2 * p;
  const inX = PAD_X, inW = inN * CELL;
  const kX = inX + inW + 42, kY = TOP + (inW - 3 * KC) / 2;
  const oX = kX + 3 * KC + 54, oCell = Math.min(CELL, (inW - 4) / m);
  const H = TOP + inW + 46;
  const Wv = oX + m * oCell + PAD_X;
  const cellIn = (r: number, c: number) => ({ x: inX + (c + p) * CELL, y: TOP + (r + p) * CELL });

  // The 9 products behind the current output
  const terms: number[] = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const y = wy + i, x = wx + j;
    terms.push(y >= 0 && y < NI && x >= 0 && x < NI ? w[i * 3 + j] * img[y * NI + x] : 0);
  }
  const value = out.px[cur];

  const toggle = (r: number, c: number) => setImg(a => { const b = a.slice(); b[r * NI + c] = b[r * NI + c] > 0.5 ? 0 : 1; return b; });

  return (
    <Figure
      title={L("title", "A 3×3 kernel sliding over an image")}
      head={<Choice value={kname} onChange={change(setK)} options={[
        ["vert", L("vert", "vertical edge")], ["horiz", L("horiz", "horizontal edge")], ["blur", L("blur", "blur")],
        ["sharp", L("sharp", "sharpen")], ["ident", L("ident", "identity")]] as const} />}
      controls={<>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{L("image", "image")}</span>
          {([["square", L("square", "square")], ["edge", L("edge", "edge")], ["seven", "7"]] as const).map(([k, label]) => (
            <Btn key={k} onClick={() => { setImg(preset(k)); setPos(0); }}>{label}</Btn>
          ))}
          <span className="text-[10px] font-mono text-[var(--text-muted)] ml-2">{L("padding", "padding p")}</span>
          <Choice value={pad} onChange={change(setPad)} options={[["0", "0"], ["1", "1"]] as const} />
          <span className="text-[10px] font-mono text-[var(--text-muted)] ml-2">{L("stride", "stride s")}</span>
          <Choice value={stride} onChange={change(setStride)} options={[["1", "1"], ["2", "2"]] as const} />
        </Row>
        <Row>
          <Readout>{L("size", "output")} ({NI} + 2·{p} − 3)/{s} + 1 = {m} → {m}×{m}</Readout>
          <Readout color={value >= 0 ? C.teal : C.red}>{L("at", "pixel")} ({orow}, {ocol}) = {+value.toFixed(2)}</Readout>
        </Row>
      </>}
      note={L("note", "The window (amber) covers 9 input pixels. Each is multiplied by the kernel weight in the same place, and the 9 products are added: that sum is one pixel of the output, the feature map. Then the window moves on. The same 9 weights are used at every position. The vertical-edge kernel subtracts the left column from the right one: on flat areas the two cancel and the output is 0; where the image gets brighter to the right it is positive (teal), darker to the right negative (red). Click input pixels to draw your own image. Padding 1 adds a ring of zeros (dashed) so the output keeps the input's size; stride 2 jumps two pixels at a time and halves it.")}
    >
      <div ref={vis.ref} className="flex flex-col">
        <svg viewBox={`0 0 ${Wv} ${H}`} className="w-full h-auto" role="img">
          <T x={inX} y={TOP - 10} size={9}>{L("input", "input")} {NI}×{NI}</T>
          {Array.from({ length: inN * inN }, (_, k) => {
            const r = Math.floor(k / inN) - p, c = (k % inN) - p;
            const inside = r >= 0 && r < NI && c >= 0 && c < NI;
            const { x, y } = cellIn(r, c);
            const v = inside ? img[r * NI + c] : 0;
            return (
              <rect key={k} x={x + 1} y={y + 1} width={CELL - 2} height={CELL - 2} rx={2}
                fill={inside ? C.fg : "none"} fillOpacity={inside ? 0.06 + 0.8 * v : 0}
                stroke={C.muted} strokeOpacity={inside ? 0.25 : 0.45} strokeDasharray={inside ? undefined : "2 2"}
                style={{ cursor: inside ? "pointer" : undefined }}
                onClick={inside ? () => toggle(r, c) : undefined} />
            );
          })}
          {terms.map((tv, k) => {
            const { x, y } = cellIn(wy + Math.floor(k / 3), wx + (k % 3));
            return <T key={k} x={x + CELL / 2} y={y + CELL / 2 + 3} size={7.5} anchor="middle" color={tv === 0 ? C.muted : tv > 0 ? C.teal : C.red}>{tv === 0 ? "" : +tv.toFixed(2)}</T>;
          })}
          <rect x={cellIn(wy, wx).x} y={cellIn(wy, wx).y} width={3 * CELL} height={3 * CELL} rx={3}
            fill="none" stroke={C.amber} strokeWidth={2.4} pointerEvents="none" />

          <T x={kX} y={kY - 10} size={9}>{L("kernel", "kernel")} 3×3</T>
          {w.map((kv, k) => (
            <g key={k}>
              <rect x={kX + (k % 3) * KC + 1} y={kY + Math.floor(k / 3) * KC + 1} width={KC - 2} height={KC - 2} rx={3}
                fill={kv === 0 ? "var(--card)" : kv > 0 ? C.teal : C.red} fillOpacity={kv === 0 ? 1 : 0.18} stroke={C.amber} strokeOpacity={0.6} />
              <T x={kX + (k % 3) * KC + KC / 2} y={kY + Math.floor(k / 3) * KC + KC / 2 + 3.5} size={9.5} anchor="middle" color={C.fg}>{fmtW(kv)}</T>
            </g>
          ))}
          <T x={kX + 1.5 * KC} y={kY + 3 * KC + 18} size={9} anchor="middle" color={C.amber}>Σ = {+value.toFixed(2)}</T>
          <path d={`M${kX + 3 * KC + 10},${kY + 1.5 * KC}h${54 - 24}`} stroke={C.muted} strokeWidth={1.4} markerEnd="url(#convArrow)" />
          <defs><marker id="convArrow" markerWidth={7} markerHeight={7} refX={6} refY={3.5} orient="auto"><path d="M0,0L7,3.5L0,7z" fill={C.muted} /></marker></defs>

          <T x={oX} y={TOP - 10} size={9}>{L("map", "feature map")} {m}×{m}</T>
          {Array.from({ length: total }, (_, k) => {
            const done = k <= cur;
            const h = heat(out.px[k], maxAbs);
            const x = oX + (k % m) * oCell, y = TOP + Math.floor(k / m) * oCell;
            return (
              <g key={k} style={{ cursor: "pointer" }} onClick={() => { setPlaying(false); setPos(k); }}>
                <rect x={x + 1} y={y + 1} width={oCell - 2} height={oCell - 2} rx={2}
                  fill={done ? h.fill : "var(--card)"} fillOpacity={done ? h.opacity : 1}
                  stroke={k === cur ? C.amber : C.muted} strokeOpacity={k === cur ? 1 : 0.25} strokeWidth={k === cur ? 2 : 1} />
                {done && oCell >= 20 && Math.abs(out.px[k]) > 1e-9 && (
                  <T x={x + oCell / 2} y={y + oCell / 2 + 3} size={7} anchor="middle" color={C.fg}>{+out.px[k].toFixed(1)}</T>
                )}
              </g>
            );
          })}
        </svg>
        <Transport t={t} playing={playing} onPlay={() => { if (cur >= total - 1) setPos(0); setPlaying(v => !v); }}
          onStep={() => { setPlaying(false); setPos(q => Math.min(q + 1, total - 1)); }}
          onBack={() => { setPlaying(false); setPos(q => Math.max(q - 1, 0)); }}
          onReset={() => { setPlaying(false); setPos(0); }}
          readout={`${cur + 1} / ${total}`} />
      </div>
    </Figure>
  );
}
