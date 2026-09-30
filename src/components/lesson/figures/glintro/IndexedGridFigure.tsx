"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, Slider, Sliders, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A grid of quads, each two triangles, drawn with and without an index buffer.
// Every grid point is one unique vertex, numbered row by row; the index list
// names three vertices per triangle. Clicking a triangle highlights its three
// indices and where they sit in the list. The memory readout compares
// duplicating vertices (glDrawArrays) with unique vertices plus indices
// (glDrawElements) for the chosen vertex size and index type.

const ITYPES = { ubyte: [1, 256, "GL_UNSIGNED_BYTE"], ushort: [2, 65536, "GL_UNSIGNED_SHORT"], uint: [4, 4294967296, "GL_UNSIGNED_INT"] } as const;
type IType = keyof typeof ITYPES;

const GW = 360, GH = 240, OX = 20, OY = 16;

/** Triangle list for a cols × rows grid: per quad (tl, bl, br) and (tl, br, tr), counter-clockwise with y up. */
function gridTriangles(cols: number, rows: number) {
  const tris: [number, number, number][] = [];
  const id = (c: number, r: number) => r * (cols + 1) + c;          // r = 0 is the top row
  for (let r = 0; r < rows; ++r) for (let c = 0; c < cols; ++c) {
    const tl = id(c, r), tr = id(c + 1, r), bl = id(c, r + 1), br = id(c + 1, r + 1);
    tris.push([tl, bl, br], [tl, br, tr]);
  }
  return tris;
}

export function IndexedGridFigure({ t }: { t?: TrackTranslations }) {
  const [cols, setCols] = useState(3);
  const [rows, setRows] = useState(2);
  const [vsize, setVsize] = useState(32);
  const [itype, setItype] = useState<IType>("uint");
  const [sel, setSel] = useState(0);

  const tris = gridTriangles(cols, rows);
  const verts = (cols + 1) * (rows + 1);
  const cur = tris[Math.min(sel, tris.length - 1)];
  const [isize, imax, iname] = ITYPES[itype];
  const plain = tris.length * 3 * vsize;
  const indexed = verts * vsize + tris.length * 3 * isize;
  const tooMany = verts > imax;

  const px = (v: number) => {
    const c = v % (cols + 1), r = Math.floor(v / (cols + 1));
    return { x: OX + (c / cols) * GW, y: OY + (r / rows) * GH };
  };

  return (
    <Figure
      title={tx(t, "figGlIdx_title", "Shared vertices and an index buffer")}
      head={<Choice value={itype} onChange={setItype} options={[["ubyte", "GL_UNSIGNED_BYTE"], ["ushort", "GL_UNSIGNED_SHORT"], ["uint", "GL_UNSIGNED_INT"]] as const} />}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figGlIdx_cols", "columns")} value={cols} min={1} max={8} step={1} onChange={v => { setCols(v); setSel(0); }} fmt={String} />
          <Slider label={tx(t, "figGlIdx_rows", "rows")} value={rows} min={1} max={6} step={1} onChange={v => { setRows(v); setSel(0); }} fmt={String} />
          <Slider label={tx(t, "figGlIdx_vsize", "bytes / vertex")} value={vsize} min={12} max={64} step={4} onChange={setVsize} fmt={v => `${v} B`} />
        </Sliders>
        <Row>
          <Readout>{tx(t, "figGlIdx_tris", "triangles")}: {tris.length}</Readout>
          <Readout>{tx(t, "figGlIdx_unique", "unique vertices")}: {verts}</Readout>
          <Readout>glDrawArrays: {tris.length * 3} × {vsize} B = {plain} B</Readout>
          <Readout color={indexed < plain ? C.green : C.amber}>glDrawElements: {verts} × {vsize} + {tris.length * 3} × {isize} = {indexed} B</Readout>
        </Row>
        <p className="font-mono text-[11.5px] text-[var(--text-main)]">
          {tx(t, "figGlIdx_selected", "triangle")} {sel}: indices[{sel * 3}…{sel * 3 + 2}] = {cur[0]}, {cur[1]}, {cur[2]}
          {"  ·  "}glDrawElements(GL_TRIANGLES, {tris.length * 3}, {iname}, 0)
        </p>
        {tooMany && <p className="text-[12.5px]" style={{ color: C.red }}>{tx(t, "figGlIdx_tooMany", "This mesh has more vertices than an unsigned byte can number (0…255): indices would wrap around and point at the wrong vertices. Use GL_UNSIGNED_SHORT.")}</p>}
      </>}
      note={tx(t, "figGlIdx_note", "Click any triangle. Each grid point is stored once and numbered row by row; every triangle is three numbers in the index list, and neighbouring triangles simply repeat the numbers of the vertices they share. Without indices each triangle needs its own three full vertices. The bigger the vertex (a real model has position, normal and texture coordinates: 32 bytes) and the more triangles share each vertex, the bigger the saving. Index size matters too: GL_UNSIGNED_SHORT halves the index list but can only number 65 536 vertices.")}
    >
      <svg viewBox={`0 0 ${GW + OX * 2 + 200} ${GH + OY * 2 + 8}`} className="w-full h-auto" role="img">
        {tris.map((tri, k) => {
          const p = tri.map(px), on = k === Math.min(sel, tris.length - 1);
          return (
            <polygon key={k} points={p.map(q => `${q.x},${q.y}`).join(" ")} onClick={() => setSel(k)} style={{ cursor: "pointer" }}
              fill={on ? C.amber : k % 2 ? C.sky : C.teal} fillOpacity={on ? 0.5 : 0.13} stroke={C.axis} strokeWidth={1} />
          );
        })}
        {Array.from({ length: verts }, (_, v) => {
          const p = px(v), on = cur.includes(v);
          return (
            <g key={v} pointerEvents="none">
              <circle cx={p.x} cy={p.y} r={on ? 9 : 7} fill={on ? C.amber : "var(--card)"} stroke={on ? C.amber : C.axis} />
              <T x={p.x} y={p.y + 3} size={7.5} anchor="middle" bold color={C.fg}>{v}</T>
            </g>
          );
        })}
        {/* The index list */}
        <T x={GW + OX * 2} y={OY + 4} size={8.5} bold color={C.fg}>indices[]</T>
        {tris.slice(0, 24).map((tri, k) => (
          <T key={k} x={GW + OX * 2 + (k >= 12 ? 100 : 0)} y={OY + 20 + (k % 12) * 18} size={8.5}
            color={k === Math.min(sel, tris.length - 1) ? C.amber : C.muted} bold={k === sel}>
            {tri.join(", ")}{k < tris.length - 1 ? "," : ""}
          </T>
        ))}
        {tris.length > 24 && <T x={GW + OX * 2} y={OY + 20 + 12 * 18} size={8}>… {tris.length - 24} {tx(t, "figGlIdx_more", "more")}</T>}
      </svg>
    </Figure>
  );
}
