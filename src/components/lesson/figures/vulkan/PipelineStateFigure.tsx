"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, C, T, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Six vertices, already in framebuffer space, run through the fixed-function
// part of a graphics pipeline: input assembly (the topology groups vertices
// into points, lines or triangles), then the rasterizer (front face from the
// winding, culling, polygon mode). The create-info structs on the right carry
// exactly the values chosen, which a VkPipeline bakes in at creation.

type Topo = "POINT_LIST" | "LINE_LIST" | "LINE_STRIP" | "TRIANGLE_LIST" | "TRIANGLE_STRIP";
type Poly = "FILL" | "LINE" | "POINT";
type Cull = "NONE" | "BACK" | "FRONT";
type Face = "COUNTER_CLOCKWISE" | "CLOCKWISE";

const W = 400, H = 210, OX = 20, OY = 30;
const V: Pt[] = [
  { x: 40, y: 150 }, { x: 100, y: 50 }, { x: 160, y: 150 },
  { x: 220, y: 50 }, { x: 280, y: 150 }, { x: 340, y: 50 },
].map(p => ({ x: p.x + OX, y: p.y + OY }));
const COLS = [C.red, C.amber, C.green, C.sky, C.purple, C.pink];

/** The vertex indices of each primitive, as the Vulkan spec defines them. */
function assemble(topo: Topo): number[][] {
  const n = V.length, out: number[][] = [];
  switch (topo) {
    case "POINT_LIST": for (let i = 0; i < n; i++) out.push([i]); break;
    case "LINE_LIST": for (let i = 0; i + 1 < n; i += 2) out.push([i, i + 1]); break;
    case "LINE_STRIP": for (let i = 0; i + 1 < n; i++) out.push([i, i + 1]); break;
    case "TRIANGLE_LIST": for (let i = 0; i + 2 < n; i += 3) out.push([i, i + 1, i + 2]); break;
    // Odd triangles swap two vertices so every triangle keeps the same winding
    case "TRIANGLE_STRIP": for (let i = 0; i + 2 < n; i++) out.push([i, i + 1 + (i % 2), i + 2 - (i % 2)]); break;
  }
  return out;
}

/** With y pointing down, a positive cross product means clockwise on screen. */
const isCw = ([a, b, c]: number[]) =>
  (V[b].x - V[a].x) * (V[c].y - V[a].y) - (V[c].x - V[a].x) * (V[b].y - V[a].y) > 0;

export function PipelineStateFigure({ t }: { t?: TrackTranslations }) {
  const [topo, setTopo] = useState<Topo>("TRIANGLE_LIST");
  const [poly, setPoly] = useState<Poly>("FILL");
  const [cull, setCull] = useState<Cull>("NONE");
  const [face, setFace] = useState<Face>("CLOCKWISE");

  const prims = assemble(topo);
  const tris = prims.length > 0 && prims[0].length === 3;
  const info = prims.map(p => {
    if (p.length < 3) return { p, front: true, culled: false };
    const front = isCw(p) === (face === "CLOCKWISE");
    const culled = cull === "BACK" ? !front : cull === "FRONT" ? front : false;
    return { p, front, culled };
  });
  const culledN = info.filter(i => i.culled).length;
  const pts = (p: number[]) => p.map(i => `${V[i].x},${V[i].y}`).join(" ");

  const code = [
    `VkPipelineInputAssemblyStateCreateInfo ia{};`,
    `ia.topology    = VK_PRIMITIVE_TOPOLOGY_${topo};`,
    ``,
    `VkPipelineRasterizationStateCreateInfo rs{};`,
    `rs.polygonMode = VK_POLYGON_MODE_${poly};`,
    `rs.cullMode    = VK_CULL_MODE_${cull === "NONE" ? "NONE" : `${cull}_BIT`};`,
    `rs.frontFace   = VK_FRONT_FACE_${face};`,
    `rs.lineWidth   = 1.0f;`,
  ];

  return (
    <Figure
      title={tx(t, "figVkPipe_title", "Input assembly and rasterizer state")}
      controls={<>
        <Row><span className="text-[10px] font-mono text-[var(--text-muted)] w-20">topology</span>
          <Choice value={topo} onChange={setTopo} options={[["POINT_LIST", "points"], ["LINE_LIST", "line list"], ["LINE_STRIP", "line strip"], ["TRIANGLE_LIST", "tri list"], ["TRIANGLE_STRIP", "tri strip"]] as const} /></Row>
        <Row><span className="text-[10px] font-mono text-[var(--text-muted)] w-20">polygonMode</span>
          <Choice value={poly} onChange={setPoly} options={[["FILL", "FILL"], ["LINE", "LINE"], ["POINT", "POINT"]] as const} /></Row>
        <Row><span className="text-[10px] font-mono text-[var(--text-muted)] w-20">cullMode</span>
          <Choice value={cull} onChange={setCull} options={[["NONE", "NONE"], ["BACK", "BACK"], ["FRONT", "FRONT"]] as const} /></Row>
        <Row><span className="text-[10px] font-mono text-[var(--text-muted)] w-20">frontFace</span>
          <Choice value={face} onChange={setFace} options={[["COUNTER_CLOCKWISE", "CCW"], ["CLOCKWISE", "CW"]] as const} /></Row>
        <Row>
          <Readout>{prims.length} {tris ? tx(t, "figVkPipe_tris", "triangles") : prims[0]?.length === 2 ? tx(t, "figVkPipe_lines", "lines") : tx(t, "figVkPipe_points", "points")}</Readout>
          {tris && <Readout color={culledN ? C.amber : undefined}>{tx(t, "figVkPipe_culled", "culled")} {culledN}</Readout>}
        </Row>
        <pre className="text-[10.5px] leading-[1.5] font-mono p-3 rounded-lg bg-[var(--code-bg)] border border-[var(--border)] overflow-x-auto text-[var(--text-main)]">{code.join("\n")}</pre>
      </>}
      note={tx(t, "figVkPipe_note", "The six vertices are already in framebuffer coordinates, so y points down. The topology decides how they are grouped: a list uses each vertex once, a strip reuses the previous ones, so six vertices make two list triangles but four strip triangles. In a strip every second triangle has two vertices swapped, so all of them keep the same winding. The rasterizer then calls a triangle front-facing when its on-screen winding matches frontFace, and cullMode throws away the back (or front) faces before any fragment is shaded. The list's two triangles wind in opposite directions, so culling removes one of them whichever face you choose. polygonMode LINE and POINT (wireframe) need the fillModeNonSolid device feature.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-w-[560px] mx-auto block" role="img">
        {info.map(({ p, front, culled }, k) => {
          if (p.length === 1) return <circle key={k} cx={V[p[0]].x} cy={V[p[0]].y} r={4} fill={C.fg} />;
          if (p.length === 2) return <line key={k} x1={V[p[0]].x} y1={V[p[0]].y} x2={V[p[1]].x} y2={V[p[1]].y} stroke={C.sky} strokeWidth={2.2} />;
          const cx = (V[p[0]].x + V[p[1]].x + V[p[2]].x) / 3, cy = (V[p[0]].y + V[p[1]].y + V[p[2]].y) / 3;
          const col = front ? C.green : C.orange;
          return (
            <g key={k}>
              {culled
                ? <polygon points={pts(p)} fill="none" stroke={C.muted} strokeDasharray="3 3" />
                : poly === "FILL"
                  ? <polygon points={pts(p)} fill={col} fillOpacity={0.3} stroke={col} strokeWidth={1.2} />
                  : poly === "LINE"
                    ? <polygon points={pts(p)} fill="none" stroke={col} strokeWidth={1.6} />
                    : p.map(i => <circle key={i} cx={V[i].x} cy={V[i].y} r={3.5} fill={col} />)}
              <T x={cx} y={cy + 3} size={8} anchor="middle" color={culled ? C.muted : col} bold>
                {culled ? tx(t, "figVkPipe_culledOne", "culled") : `${isCw(p) ? "CW" : "CCW"} · ${front ? "front" : "back"}`}
              </T>
            </g>
          );
        })}
        {V.map((v, i) => (
          <g key={i}>
            <circle cx={v.x} cy={v.y} r={2.5} fill={COLS[i]} />
            <T x={v.x} y={v.y + (v.y > 120 ? 16 : -8)} size={8.5} anchor="middle" color={COLS[i]} bold>v{i}</T>
          </g>
        ))}
      </svg>
    </Figure>
  );
}
