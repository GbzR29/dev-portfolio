"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// How a DSA vertex array is wired. Attributes (what the shader reads, with a
// format and an offset inside one vertex) point at binding points; binding
// points hold a buffer, a start offset, a stride and a divisor. Three layouts:
// interleaved (one buffer, three attributes on one binding), separate streams
// (one buffer per attribute) and interleaved + a per-instance stream. "Swap
// mesh" rebinds binding 0 to another buffer: one call, and the attribute
// formats never change — the reason the format and the buffer were split.

type Layout = "inter" | "streams" | "inst";
type Attr = { loc: number; name: string; type: string; size: number; off: number; bind: number };
type Bind = { idx: number; buf: string; stride: number; div: number };

const ATTRS: Record<Layout, Attr[]> = {
  inter: [
    { loc: 0, name: "aPos", type: "vec3", size: 3, off: 0, bind: 0 },
    { loc: 1, name: "aNormal", type: "vec3", size: 3, off: 12, bind: 0 },
    { loc: 2, name: "aUV", type: "vec2", size: 2, off: 24, bind: 0 },
  ],
  streams: [
    { loc: 0, name: "aPos", type: "vec3", size: 3, off: 0, bind: 0 },
    { loc: 1, name: "aNormal", type: "vec3", size: 3, off: 0, bind: 1 },
    { loc: 2, name: "aUV", type: "vec2", size: 2, off: 0, bind: 2 },
  ],
  inst: [
    { loc: 0, name: "aPos", type: "vec3", size: 3, off: 0, bind: 0 },
    { loc: 1, name: "aNormal", type: "vec3", size: 3, off: 12, bind: 0 },
    { loc: 2, name: "aUV", type: "vec2", size: 2, off: 24, bind: 0 },
    { loc: 3, name: "aOffset", type: "vec4", size: 4, off: 0, bind: 1 },
  ],
};

function binds(layout: Layout, mesh: string): Bind[] {
  if (layout === "inter") return [{ idx: 0, buf: `${mesh}VBO`, stride: 32, div: 0 }];
  if (layout === "streams") return [
    { idx: 0, buf: `${mesh}Pos`, stride: 12, div: 0 },
    { idx: 1, buf: `${mesh}Nrm`, stride: 12, div: 0 },
    { idx: 2, buf: `${mesh}UV`, stride: 8, div: 0 },
  ];
  return [{ idx: 0, buf: `${mesh}VBO`, stride: 32, div: 0 }, { idx: 1, buf: "offsetsVBO", stride: 16, div: 1 }];
}

const W = 620, BOX = 30, GAP = 12, AX = 14, AW = 170, BX = 262, BW = 136, FX = 448, FW = 158;
const rowY = (i: number) => 14 + i * (BOX + GAP);

export function VertexBindingFigure({ t }: { t?: TrackTranslations }) {
  const L = (k: string, en: string) => tx(t, `figVtxBind_${k}`, en);
  const [layout, setLayout] = useState<Layout>("inter");
  const [rock, setRock] = useState(false);
  const mesh = rock ? "rock" : "ship";
  const attrs = ATTRS[layout], bs = binds(layout, mesh);
  const H = rowY(Math.max(attrs.length, bs.length)) + 4;
  const bindY = (idx: number) => rowY(bs.findIndex(b => b.idx === idx)) + BOX / 2;
  const swapped = (b: Bind) => rock && !b.div;          // the mesh's own vertex buffers

  const code = [
    ...bs.map(b => ({ s: `glVertexArrayVertexBuffer(vao, ${b.idx}, ${b.buf}, 0, ${b.stride});`, hot: swapped(b) })),
    ...bs.filter(b => b.div).map(b => ({ s: `glVertexArrayBindingDivisor(vao, ${b.idx}, ${b.div});`, hot: false })),
    ...attrs.map(a => ({ s: `glVertexArrayAttribFormat(vao, ${a.loc}, ${a.size}, GL_FLOAT, GL_FALSE, ${a.off});`, hot: false })),
    ...attrs.map(a => ({ s: `glVertexArrayAttribBinding(vao, ${a.loc}, ${a.bind});`, hot: false })),
    ...attrs.map(a => ({ s: `glEnableVertexArrayAttrib(vao, ${a.loc});`, hot: false })),
  ];

  return (
    <Figure
      title={L("title", "Attributes → binding points → buffers")}
      head={<Choice value={layout} onChange={setLayout} options={[
        ["inter", L("inter", "interleaved")], ["streams", L("streams", "separate streams")], ["inst", L("inst", "+ instance stream")]] as const} />}
      controls={<Row>
        <Btn active={rock} onClick={() => setRock(v => !v)}>{L("swap", "swap mesh: ship → rock")}</Btn>
        <span className="text-[11px] text-[var(--text-muted)]">{L("swapHint", "only the highlighted calls change")}</span>
      </Row>}
      note={L("note", "An attribute says what one vertex holds: its location, its format (2–4 floats) and its offset inside the vertex. A binding point says where the vertices come from: a buffer, a start offset, the stride from one vertex to the next, and how often to advance (divisor 0 per vertex, 1 per instance). Interleaved data puts three attributes on one binding with offsets 0, 12 and 24 inside a 32-byte vertex; separate streams give each attribute its own binding with offset 0. Drawing a different mesh with the same layout only rebinds its buffers, one glVertexArrayVertexBuffer per stream: the formats stay as they are. glVertexAttribPointer welded all of this into one call, so changing the buffer meant re-describing the format too.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <T x={AX} y={10} size={8}>{L("attrs", "attributes (shader inputs)")}</T>
        <T x={BX} y={10} size={8}>{L("binds", "binding points")}</T>
        <T x={FX} y={10} size={8}>{L("bufs", "buffers")}</T>
        {attrs.map((a, i) => {
          const y = rowY(i) + 4;
          return <g key={a.loc}>
            <path d={`M ${AX + AW} ${y + BOX / 2} C ${(AX + AW + BX) / 2} ${y + BOX / 2}, ${(AX + AW + BX) / 2} ${bindY(a.bind) + 4}, ${BX} ${bindY(a.bind) + 4}`}
              fill="none" stroke={a.bind ? C.purple : C.sky} strokeWidth={1.5} opacity={0.8} />
            <rect x={AX} y={y} width={AW} height={BOX} rx={5} fill={C.bg} stroke="var(--border)" />
            <T x={AX + 8} y={y + 13} size={9.5} color={C.fg} bold>{`${a.loc} · ${a.name}`}</T>
            <T x={AX + 8} y={y + 25} size={8.5}>{`${a.type} · ${L("offset", "offset")} ${a.off} B`}</T>
          </g>;
        })}
        {bs.map((b, i) => {
          const y = rowY(i) + 4;
          return <g key={b.idx}>
            <line x1={BX + BW} x2={FX} y1={y + BOX / 2} y2={y + BOX / 2} stroke={swapped(b) ? C.amber : "var(--code-gutter)"} strokeWidth={1.5} />
            <rect x={BX} y={y} width={BW} height={BOX} rx={5} fill={C.bg} stroke={b.div ? C.purple : C.sky} />
            <T x={BX + 8} y={y + 13} size={9.5} color={C.fg} bold>{`${L("binding", "binding")} ${b.idx}`}</T>
            <T x={BX + 8} y={y + 25} size={8.5}>{`stride ${b.stride} · ${b.div ? L("perInst", "per instance") : L("perVert", "per vertex")}`}</T>
            <rect x={FX} y={y} width={FW} height={BOX} rx={5} fill={C.bg} stroke={swapped(b) ? C.amber : "var(--border)"} />
            <T x={FX + 8} y={y + 19} size={9.5} color={swapped(b) ? C.amber : C.fg}>{b.buf}</T>
          </g>;
        })}
      </svg>
      <pre className="px-3 pb-3 font-mono text-[10.5px] leading-relaxed overflow-x-auto text-[var(--text-main)]">
        {code.map((c, i) => <div key={i} style={{ color: c.hot && rock ? C.amber : undefined }}>{c.s}</div>)}
      </pre>
    </Figure>
  );
}
