"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, C, T, f2, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// One triangle through every stage of the pipeline, with real numbers: the
// vertex array, the vertex shader (3 runs), primitive assembly, clipping
// (one vertex is outside NDC, so the triangle is cut into a quad), the
// viewport transform to a 16 × 10 framebuffer, rasterization, the fragment
// shader, the depth test against a grey box already in the framebuffer, and
// the final image. The viewport covers the whole drawing, so NDC space and
// the pixel grid line up.

const GW = 16, GH = 10, CELL = 30, W = GW * CELL, H = GH * CELL;
const OUT = 96;                                           // drawing space right of x = +1, for v1
const V: { p: Pt; c: [number, number, number]; hex: string }[] = [
  { p: { x: -0.8, y: -0.6 }, c: [239, 68, 68], hex: C.red },
  { p: { x: 1.3, y: -0.3 }, c: [34, 197, 94], hex: C.green },
  { p: { x: 0.0, y: 0.8 }, c: [59, 130, 246], hex: C.blue },
];
// A grey box already drawn, nearer than our triangle (depth 0.3 < 0.5).
const BOX = { i0: 9, i1: 15, j0: 4, j1: 9, depth: 0.3 };
const TRI_DEPTH = 0.5;                                   // z = 0 in NDC → (0 + 1) / 2

const ndcToSvg = (p: Pt) => ({ x: ((p.x + 1) / 2) * W, y: H - ((p.y + 1) / 2) * H });
const ndcToWin = (p: Pt) => ({ x: ((p.x + 1) / 2) * GW, y: ((p.y + 1) / 2) * GH });
const edge = (a: Pt, b: Pt, p: Pt) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);

/** Sutherland–Hodgman clip of a polygon against the NDC square. */
function clipNdc(poly: Pt[]) {
  const planes: [(p: Pt) => number][] = [[p => 1 - p.x], [p => p.x + 1], [p => 1 - p.y], [p => p.y + 1]];
  let out = poly;
  for (const [d] of planes) {
    const next: Pt[] = [];
    out.forEach((a, k) => {
      const b = out[(k + 1) % out.length], da = d(a), db = d(b);
      if (da >= 0) next.push(a);
      if (da * db < 0) { const s = da / (da - db); next.push({ x: a.x + (b.x - a.x) * s, y: a.y + (b.y - a.y) * s }); }
    });
    out = next;
  }
  return out;
}

// ── The fixed example, computed once ──
const WIN = V.map(v => ndcToWin(v.p));
const CLIPPED = clipNdc(V.map(v => v.p));
const FRAGMENTS = (() => {
  const area = edge(WIN[0], WIN[1], WIN[2]);
  const out: { i: number; j: number; col: string; hidden: boolean }[] = [];
  for (let j = 0; j < GH; ++j) for (let i = 0; i < GW; ++i) {
    const c = { x: i + 0.5, y: j + 0.5 };
    const w = [edge(WIN[1], WIN[2], c) / area, edge(WIN[2], WIN[0], c) / area, edge(WIN[0], WIN[1], c) / area];
    if (w.some(x => x < 0)) continue;
    const rgb = [0, 1, 2].map(k => Math.round(w[0] * V[0].c[k] + w[1] * V[1].c[k] + w[2] * V[2].c[k]));
    const inBox = i >= BOX.i0 && i < BOX.i1 && j >= BOX.j0 && j < BOX.j1;
    out.push({ i, j, col: `rgb(${rgb.join(",")})`, hidden: inBox && TRI_DEPTH >= BOX.depth });
  }
  return out;
})();

const STAGES: [string, string, string][] = [
  ["figGlWalk_s0", "vertex data", "The program's array: three vertices, each a position (x, y, z) and a colour. glDrawArrays(GL_TRIANGLES, 0, 3) sends them into the pipeline."],
  ["figGlWalk_s1", "vertex shader", "Runs once per vertex, three times here, each run seeing only its own vertex. It writes gl_Position (here the position unchanged, with w = 1) and passes the colour on in an out variable."],
  ["figGlWalk_s2", "primitive assembly", "GL_TRIANGLES groups the vertices three at a time into triangles. With GL_LINES they would be joined in pairs, with GL_POINTS drawn alone."],
  ["figGlWalk_s3", "clipping", "Everything outside the NDC square from −1 to +1 is cut away. The green vertex sits at x = 1.3, so the triangle is cut along x = 1 into a four-sided polygon, which is split into two triangles. (Division by w also happens here; with w = 1 it changes nothing.)"],
  ["figGlWalk_s4", "viewport transform", "glViewport(0, 0, 16, 10) maps NDC to window pixels: x_w = (x + 1) / 2 · 16 and y_w = (y + 1) / 2 · 10. NDC −1 becomes the left or bottom edge, +1 the right or top edge."],
  ["figGlWalk_s5", "rasterization", "Each pixel whose centre is inside a triangle becomes a fragment: a candidate pixel carrying interpolated values (colour, depth). This is the step that turns geometry into pixels."],
  ["figGlWalk_s6", "fragment shader", "Runs once per fragment and outputs its colour. Here it just outputs the interpolated vertex colour, so red, green and blue blend smoothly across the triangle."],
  ["figGlWalk_s7", "depth test & blending", "Fixed-function tests decide whether each fragment is written. A grey box nearer to the camera (depth 0.3) is already in the framebuffer; our fragments have depth 0.5, so where they overlap the box they fail GL_LESS and are thrown away (crossed out)."],
  ["figGlWalk_s8", "framebuffer", "What survives is written to the framebuffer, and glfwSwapBuffers shows it."],
];

export function PipelineWalkFigure({ t }: { t?: TrackTranslations }) {
  const [s, setS] = useState(0);
  const px = FRAGMENTS, win = WIN, clipped = CLIPPED;
  const grid = s >= 4;
  const cellRect = (i: number, j: number) => ({ x: i * CELL, y: H - (j + 1) * CELL, width: CELL, height: CELL });
  const sv = V.map(v => ndcToSvg(v.p));

  return (
    <Figure
      title={tx(t, "figGlWalk_title", "One triangle through the pipeline")}
      controls={<>
        <Row>
          <Btn onClick={() => setS(k => Math.max(0, k - 1))}>◀</Btn>
          {STAGES.map(([key, en], k) => <Btn key={key} active={k === s} onClick={() => setS(k)}>{k + 1}. {tx(t, key, en)}</Btn>)}
          <Btn onClick={() => setS(k => Math.min(STAGES.length - 1, k + 1))}>▶</Btn>
        </Row>
        <p className="text-[13px] text-[var(--text-main)] leading-relaxed min-h-[4.5em]">{tx(t, `${STAGES[s][0]}b`, STAGES[s][2])}</p>
      </>}
      note={tx(t, "figGlWalk_note", "Stages 2 and 7 are the programmable ones (the vertex and fragment shaders); the rest are fixed-function hardware you only configure. Before the viewport step everything is continuous NDC space; from rasterization on it is a grid of pixels. The table under the drawing follows the three vertices through the steps that change their numbers.")}
    >
      <svg viewBox={`-30 -14 ${W + OUT + 44} ${H + 118}`} className="w-full h-auto" role="img">
        {/* Room on the right for v1, which lies outside NDC (x = 1.3) until clipping */}
        {s <= 3 && <>
          <rect x={W} y={0} width={OUT} height={H} fill={C.red} fillOpacity={0.07} />
          <line x1={W} y1={0} x2={W} y2={H} stroke={C.red} strokeOpacity={0.5} strokeDasharray="4 3" />
          <T x={W + OUT / 2} y={H - 8} size={8} anchor="middle" color={C.red}>{tx(t, "figGlWalk_outside", "outside NDC")}</T>
        </>}
        {/* Background: NDC axes or pixel grid */}
        <rect x={0} y={0} width={W} height={H} fill="none" stroke={C.axis} />
        {!grid && <>
          <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke={C.grid} />
          <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke={C.grid} />
          <T x={-4} y={H + 12} size={8} anchor="middle">−1</T><T x={W} y={H + 12} size={8} anchor="middle">+1</T>
          <T x={-6} y={4} size={8} anchor="end">+1</T>
          <T x={W - 4} y={H / 2 - 4} size={8} anchor="end">x</T><T x={W / 2 + 4} y={10} size={8}>y</T>
        </>}
        {grid && Array.from({ length: GW * GH }, (_, k) => <rect key={k} {...cellRect(k % GW, Math.floor(k / GW))} fill="none" stroke={C.grid} strokeWidth={0.7} />)}
        {grid && <>
          <T x={0} y={H + 12} size={8} anchor="middle">0</T><T x={W} y={H + 12} size={8} anchor="middle">16</T>
          <T x={-6} y={4} size={8} anchor="end">10</T>
        </>}

        {/* Grey box already in the framebuffer */}
        {s >= 7 && <rect x={BOX.i0 * CELL} y={H - BOX.j1 * CELL} width={(BOX.i1 - BOX.i0) * CELL} height={(BOX.j1 - BOX.j0) * CELL} fill="#6b7280" opacity={0.85} />}
        {s >= 7 && <T x={BOX.i0 * CELL + 6} y={H - BOX.j1 * CELL + 14} size={8.5} color="#fff">depth 0.3</T>}

        {/* Fragments */}
        {s === 5 && px.map(p => <rect key={`${p.i}-${p.j}`} {...cellRect(p.i, p.j)} fill={C.amber} fillOpacity={0.35} stroke={C.amber} strokeWidth={0.6} />)}
        {s >= 6 && px.filter(p => s < 8 || !p.hidden).map(p => <rect key={`${p.i}-${p.j}`} {...cellRect(p.i, p.j)} fill={p.col} opacity={s === 7 && p.hidden ? 0.35 : 1} />)}
        {s === 7 && px.filter(p => p.hidden).map(p => {
          const r = cellRect(p.i, p.j);
          return <path key={`x${p.i}-${p.j}`} d={`M${r.x + 6} ${r.y + 6} L${r.x + 24} ${r.y + 24} M${r.x + 24} ${r.y + 6} L${r.x + 6} ${r.y + 24}`} stroke={C.red} strokeWidth={1.6} />;
        })}

        {/* Geometry overlays */}
        {s >= 2 && s <= 5 && <polygon points={sv.map(p => `${p.x},${p.y}`).join(" ")} fill={s === 2 ? C.sky : "none"} fillOpacity={0.15}
          stroke={s >= 3 ? C.axis : C.fg} strokeWidth={1.4} strokeDasharray={s >= 3 ? "4 3" : undefined} />}
        {s >= 3 && s <= 5 && <polygon points={clipped.map(ndcToSvg).map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke={C.fg} strokeWidth={1.8} />}
        {s === 3 && (() => {
          const q = clipped.map(ndcToSvg);
          return <line x1={q[0].x} y1={q[0].y} x2={q[2].x} y2={q[2].y} stroke={C.fg} strokeWidth={1} strokeDasharray="3 3" />;
        })()}
        {s === 5 && px.map(p => <circle key={`c${p.i}-${p.j}`} cx={(p.i + 0.5) * CELL} cy={H - (p.j + 0.5) * CELL} r={2} fill={C.fg} />)}
        {s <= 4 && sv.map((p, k) => (
          <g key={k}>
            <circle cx={p.x} cy={p.y} r={6} fill={V[k].hex} stroke="var(--code-bg)" strokeWidth={1.5} />
            <T x={p.x + 9} y={p.y - 7} size={9.5} bold color={V[k].hex}>v{k}</T>
          </g>
        ))}

        {/* The numbers */}
        <g transform={`translate(0, ${H + 30})`}>
          <T x={0} y={0} size={8.5} bold color={C.fg}>{tx(t, "figGlWalk_tVertex", "vertex")}</T>
          <T x={60} y={0} size={8.5} bold color={C.fg}>{tx(t, "figGlWalk_tNdc", "position (NDC)")}</T>
          <T x={220} y={0} size={8.5} bold color={s >= 4 ? C.fg : C.muted}>{tx(t, "figGlWalk_tWin", "window pixels")}</T>
          <T x={380} y={0} size={8.5} bold color={C.fg}>{tx(t, "figGlWalk_tColour", "colour")}</T>
          {V.map((v, k) => (
            <g key={k} transform={`translate(0, ${16 + k * 16})`}>
              <T x={0} y={0} size={9} bold color={v.hex}>v{k}</T>
              <T x={60} y={0} size={9} color={C.fg}>({f2(v.p.x, 1)}, {f2(v.p.y, 1)}, 0.0)</T>
              <T x={220} y={0} size={9} color={s >= 4 ? C.fg : C.muted}>{s >= 4 ? `(${f2(win[k].x, 1)}, ${f2(win[k].y, 1)})` : "…"}</T>
              <T x={380} y={0} size={9} color={v.hex}>({v.c.map(c => f2(c / 255, 2)).join(", ")})</T>
            </g>
          ))}
        </g>
      </svg>
    </Figure>
  );
}
