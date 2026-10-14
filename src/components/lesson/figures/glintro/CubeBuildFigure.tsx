"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, T, svgPoint, useFrame, useVisible, type Pt } from "@/components/lesson/kit/figure";
import { makeProjector, frontFacing, lightAmount, useOrbit, type Projected } from "@/components/lesson/kit/scene3d";
import { Transport } from "@/components/lesson/kit/Transport";
import { useFigureSpeed } from "@/components/lesson/kit/Stepper";
import {
  CORNERS, FACE_CORNERS, FACE_NAMES, FACE_NORMALS, FLOATS, INDICES, VERTICES,
  fmtF, triCorners, triVertices, verticesAtCorner, type Layout,
} from "./cubeData";

// ── What this figure shows ────────────────────────────────────────────────────
// The cube of the chapter, drawn the way the GPU draws it: one triangle at a
// time, in the order of the index list (or of the vertex array, without one).
// The count is the second number of the draw call; the Transport adds three at
// a time. The three layouts (36 vertices; 8 + indices; 24 + indices) give the
// same picture, but the numbers on the corners show what the VBO holds: one
// vertex per corner, one per face corner, or one per triangle corner. Turning
// GL_DEPTH_TEST off paints triangles strictly in draw order, so a back face
// drawn later covers the front one (the "inside-out" cube).

const W = 440, H = 300;
const FACE_COLORS = [C.red, C.teal, C.blue, C.amber, C.green, C.purple];
const STEP_S = 0.75;                          // seconds per triangle at 1×

/** A fixed hex colour scaled toward black by k (0..1), for a little shading. */
function dim(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.round(((n >> s) & 255) * k);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

const inTri = (p: Pt, a: Pt, b: Pt, c: Pt) => {
  const s = (u: Pt, v: Pt, w: Pt) => (u.x - w.x) * (v.y - w.y) - (v.x - w.x) * (u.y - w.y);
  const d1 = s(p, a, b), d2 = s(p, b, c), d3 = s(p, c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
};

/** A point pulled from corner p toward centre q, for a vertex label. */
const inset = (p: Projected, q: Pt, k: number): Pt => ({ x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k });
const centre = (ps: Pt[]): Pt => ({ x: ps.reduce((s, p) => s + p.x, 0) / ps.length, y: ps.reduce((s, p) => s + p.y, 0) / ps.length });

type Sel = { kind: "tri"; k: number } | { kind: "corner"; c: number } | null;

export function CubeBuildFigure({ t }: { t?: TrackTranslations }) {
  const [layout, setLayout] = useState<Layout>("C");
  const [count, setCount] = useState(36);
  const [depth, setDepth] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [sel, setSel] = useState<Sel>(null);
  const [rate] = useFigureSpeed();
  const vis = useVisible<HTMLDivElement>();
  const { orbit, handlers, ref } = useOrbit({ yaw: -0.62, pitch: 0.5, zoom: 1 });
  const acc = useRef(0);
  const down = useRef<Pt | null>(null);

  // ── Playback: three more indices per step ────────────────────────────────
  const stepTo = (n: number) => {
    const c = Math.max(0, Math.min(36, n));
    setCount(c);
    setSel(c > 0 ? { kind: "tri", k: c / 3 - 1 } : null);
    return c;
  };
  useFrame(playing && vis.on, dt => {
    acc.current += dt * rate;
    if (acc.current < STEP_S) return;
    acc.current = 0;
    if (stepTo(count + 3) >= 36) setPlaying(false);
  });
  const play = () => {
    if (playing) { setPlaying(false); return; }
    if (count >= 36) stepTo(0);
    acc.current = 0;
    setPlaying(true);
  };

  // ── Projection ──────────────────────────────────────────────────────────
  const P = makeProjector(orbit, W / 2, H / 2 + 4, 118, 6);
  const sc = CORNERS.map(P);
  const faceFront = FACE_CORNERS.map(fc => frontFacing(fc.map(c => sc[c])));
  const tris = Array.from({ length: count / 3 }, (_, k) => {
    const cs = triCorners(k), ps = cs.map(c => sc[c]);
    return { k, face: Math.floor(k / 2), ps, depth: (ps[0].depth + ps[1].depth + ps[2].depth) / 3 };
  });
  // With the depth test the nearest surface wins, which for a convex cube is
  // the same as painting far to near; without it, later draws simply cover.
  const painted = depth ? [...tris].sort((a, b) => b.depth - a.depth) : tris;

  // A corner is hidden when none of the faces turned toward us touches it
  const cornerSeen = CORNERS.map((_, c) => FACE_CORNERS.some((fc, f) => faceFront[f] && fc.includes(c)));

  // ── Picking: a tap (not a drag) selects a corner or the triangle on top ─
  const pick = (p: Pt) => {
    let best = -1, bd = 13;
    sc.forEach((q, c) => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (cornerSeen[c] && d < bd) { bd = d; best = c; } });
    if (best >= 0) { setSel({ kind: "corner", c: best }); return; }
    for (let i = painted.length - 1; i >= 0; i--) {
      const tr = painted[i];
      if (inTri(p, tr.ps[0], tr.ps[1], tr.ps[2])) { setSel({ kind: "tri", k: tr.k }); return; }
    }
    setSel(null);
  };
  const svgHandlers = {
    ...handlers,
    onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => {
      down.current = { x: e.clientX, y: e.clientY };
      handlers.onPointerDown(e);
    },
    onPointerUp: (e: React.PointerEvent<SVGSVGElement>) => {
      handlers.onPointerUp(e);
      const d = down.current;
      down.current = null;
      if (d && ref.current && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 5) pick(svgPoint(ref.current, e));
    },
  };

  // ── Vertex-number labels: what the VBO holds at each corner ──────────────
  const selTriVerts: number[] = sel?.kind === "tri" ? triVertices(layout, sel.k) : [];
  const selCornerVerts: number[] = sel?.kind === "corner" ? verticesAtCorner(layout, sel.c) : [];
  const hot = (v: number) => selTriVerts.includes(v) || selCornerVerts.includes(v);

  const labels: { p: Pt; v: number; face: number }[] = [];
  if (layout === "B") {
    CORNERS.forEach((_, c) => { if (cornerSeen[c]) labels.push({ p: sc[c], v: c, face: -1 }); });
  } else if (layout === "C") {
    FACE_CORNERS.forEach((fc, f) => {
      if (!faceFront[f] || count <= f * 6) return;          // hidden, or not drawn yet
      const mid = centre(fc.map(c => sc[c]));
      fc.forEach((c, i) => labels.push({ p: inset(sc[c], mid, 0.27), v: f * 4 + i, face: f }));
    });
  } else {
    tris.forEach(tr => {
      if (!faceFront[tr.face]) return;
      const mid = centre(tr.ps);
      tr.ps.forEach((q, i) => labels.push({ p: inset(q, mid, 0.42), v: tr.k * 3 + i, face: tr.face }));
    });
  }
  // The selected triangle always shows its three vertices, even on a hidden face
  if (sel?.kind === "tri") {
    const cs = triCorners(sel.k), mid = centre(cs.map(c => sc[c]));
    selTriVerts.forEach((v, i) => {
      if (!labels.some(l => l.v === v)) labels.push({ p: layout === "B" ? sc[cs[i]] : inset(sc[cs[i]], mid, 0.35), v, face: Math.floor(sel.k / 2) });
    });
  }

  // ── Numbers for the panel ───────────────────────────────────────────────
  const verts = VERTICES[layout], idx = INDICES[layout];
  const vboBytes = verts.length * FLOATS[layout] * 4, eboBytes = idx ? idx.length * 4 : 0;
  const call = idx
    ? <>glDrawElements(GL_TRIANGLES, <b style={{ color: C.amber }}>{count}</b>, GL_UNSIGNED_INT, 0);</>
    : <>glDrawArrays(GL_TRIANGLES, 0, <b style={{ color: C.amber }}>{count}</b>);</>;

  const vertexLine = (v: number) => {
    const vx = verts[v], p = CORNERS[vx.corner];
    return `v${v} = (${p.map(fmtF).join(",")}${vx.uv ? ` | ${vx.uv.map(n => n.toFixed(0)).join(", ")}` : ""})`;
  };
  const faceName = (f: number) => tx(t, `figGlCube_f_${FACE_NAMES[f]}`, FACE_NAMES[f]);

  let detail: React.ReactNode = <span>{tx(t, "figGlCube_pickHint", "Click a triangle or a corner of the cube.")}</span>;
  if (sel?.kind === "tri") {
    const vs = triVertices(layout, sel.k);
    detail = <>
      <div>
        {tx(t, "figGlCube_tri", "triangle")} {sel.k} ({faceName(Math.floor(sel.k / 2))}):{" "}
        {idx ? <>indices[{sel.k * 3}…{sel.k * 3 + 2}] = {vs.join(", ")}</> : <>{tx(t, "figGlCube_noIdx", "no index list: the GPU reads vertices")} {vs.join(", ")}</>}
      </div>
      {vs.map(v => <div key={v} style={{ color: C.amber }}>{vertexLine(v)}</div>)}
    </>;
  } else if (sel?.kind === "corner") {
    const p = CORNERS[sel.c], vs = verticesAtCorner(layout, sel.c);
    detail = <>
      <div>
        {tx(t, "figGlCube_corner", "corner")} ({p.map(fmtF).join(",")}): {vs.length}{" "}
        {vs.length === 1 ? tx(t, "figGlCube_vertex1", "vertex") : tx(t, "figGlCube_verticesN", "vertices")} ({vs.join(", ")})
      </div>
      <div style={{ color: layout === "B" ? C.red : C.amber }}>
        {layout === "B"
          ? tx(t, "figGlCube_cornerB", "Stored once, so it can hold only one (u, v) for its three faces: a texture cannot sit right on all three.")
          : layout === "C"
            ? tx(t, "figGlCube_cornerC", "One vertex for each face it touches, each with that face's (u, v). Same position, different vertex.")
            : tx(t, "figGlCube_cornerA", "One copy for every triangle corner that lands here: the same data written out again each time.")}
      </div>
    </>;
  }

  const stage = (
    <div>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none" }} role="img" aria-label="A cube drawn triangle by triangle" {...svgHandlers}>
        {/* Wire outline of the whole cube, so the missing triangles show where they go */}
        {FACE_CORNERS.map((fc, f) => (
          <polygon key={f} points={fc.map(c => `${sc[c].x},${sc[c].y}`).join(" ")} fill="none"
            stroke={C.axis} strokeWidth={1} strokeDasharray={faceFront[f] ? undefined : "3 4"} opacity={0.7} />
        ))}

        {/* The triangles, in the order they end up painted */}
        {painted.map(tr => {
          const lit = faceFront[tr.face] ? 0.62 + 0.38 * lightAmount(FACE_NORMALS[tr.face]) : 0.45;
          return (
            <polygon key={tr.k} points={tr.ps.map(q => `${q.x},${q.y}`).join(" ")}
              fill={dim(FACE_COLORS[tr.face], lit)} stroke="var(--code-bg)" strokeWidth={1} strokeLinejoin="round" />
          );
        })}

        {/* Selected triangle on top */}
        {sel?.kind === "tri" && sel.k < tris.length && (
          <polygon points={tris[sel.k].ps.map(q => `${q.x},${q.y}`).join(" ")} fill="none"
            stroke={C.amber} strokeWidth={2.5} strokeLinejoin="round" />
        )}

        {/* What the VBO holds: vertex numbers */}
        {labels.map(({ p, v }, i) => {
          const on = hot(v);
          return (
            <g key={i} pointerEvents="none">
              <circle cx={p.x} cy={p.y} r={layout === "B" ? 8.5 : 7.5} fill={on ? C.amber : "var(--card)"} stroke={on ? C.amber : C.axis} opacity={0.95} />
              <T x={p.x} y={p.y + 3} size={layout === "B" ? 8.5 : 7.5} anchor="middle" bold color={on ? "#111" : C.fg}>{v}</T>
            </g>
          );
        })}
        {sel?.kind === "corner" && <circle cx={sc[sel.c].x} cy={sc[sel.c].y} r={15} fill="none" stroke={C.amber} strokeWidth={1.5} strokeDasharray="3 3" />}

        {!depth && count > 6 && (
          <T x={12} y={20} size={9.5} bold color={C.red}>{tx(t, "figGlCube_noDepth", "no depth test: whatever is drawn last covers")}</T>
        )}
        <T x={W - 12} y={H - 10} size={8.5} anchor="end">
          <tspan data-mouse-only="">{tx(t, "figGlCube_dragMouse", "drag to turn · click to inspect")}</tspan>
          <tspan data-touch-only="">{tx(t, "figGlCube_dragTouch", "drag to turn · tap to inspect")}</tspan>
        </T>
      </svg>
      <Transport t={t} speed playing={playing} onPlay={play}
        onStep={() => { setPlaying(false); stepTo(count + 3); }}
        onBack={() => { setPlaying(false); stepTo(count - 3); }}
        onReset={() => { setPlaying(false); stepTo(0); }}
        playLabel={tx(t, "figGlCube_play", "draw triangle by triangle")}
        readout={`${count} / 36`} />
    </div>
  );

  return (
    <Figure
      title={tx(t, "figGlCube_title", "A cube, triangle by triangle")}
      head={<>
        <Choice value={layout} onChange={v => { setLayout(v); setSel(null); }} options={[
          ["A", tx(t, "figGlCube_modeA", "36 vertices")],
          ["B", tx(t, "figGlCube_modeB", "8 + indices")],
          ["C", tx(t, "figGlCube_modeC", "24 + indices")],
        ] as const} />
        <Btn active={depth} onClick={() => setDepth(d => !d)}>GL_DEPTH_TEST</Btn>
      </>}
      controls={<>
        <p className="font-mono text-[11.5px] text-[var(--text-main)]">{call}</p>
        <Row>
          <Readout>VBO: {verts.length} × {FLOATS[layout]} floats = {vboBytes} B</Readout>
          <Readout>EBO: {idx ? `${idx.length} × 4 B = ${eboBytes} B` : "—"}</Readout>
          <Readout color={C.amber}>{tx(t, "figGlCube_total", "total")}: {vboBytes + eboBytes} B</Readout>
        </Row>
        <div className="grid gap-x-5 gap-y-0.5 sm:grid-cols-2 font-mono text-[11px] leading-relaxed">
          {FACE_NAMES.map((_, f) => (
            <div key={f} className="flex items-center gap-2 min-w-0">
              <span className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: FACE_COLORS[f] }} />
              <span className="w-14 flex-shrink-0 text-[var(--text-muted)]">{faceName(f)}</span>
              <span className="truncate">
                {Array.from({ length: 6 }, (_, j) => {
                  const pos = f * 6 + j, k = Math.floor(pos / 3);
                  const v = idx ? idx[pos] : pos;
                  const on = selTriVerts.length > 0 ? sel?.kind === "tri" && sel.k === k : hot(v);
                  return (
                    <span key={j} style={{ color: on ? C.amber : pos < count ? "var(--text-main)" : "var(--text-muted)", opacity: pos < count || on ? 1 : 0.45, fontWeight: on ? 700 : 400 }}>
                      {idx ? v : `v${v}`}{j < 5 ? (j === 2 ? ",  " : ", ") : ""}
                    </span>
                  );
                })}
              </span>
            </div>
          ))}
        </div>
        <div className="font-mono text-[11px] text-[var(--text-main)] space-y-0.5">{detail}</div>
      </>}
      note={tx(t, "figGlCube_note", "Press play to watch the draw call work through the list, three numbers per triangle. The picture is the same in all three layouts; the numbers on the corners show what the VBO holds. With 8 vertices each corner is one vertex. With 24 each corner is three vertices, one per face. With 36 every triangle corner is its own vertex. Then turn GL_DEPTH_TEST off and play again: from about the back face on, triangles drawn later cover nearer ones.")}
    >
      <div ref={vis.ref}>{stage}</div>
    </Figure>
  );
}
