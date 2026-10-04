"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Readout, Row, C, T, f2, svgPoint } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Two triangles rasterized into a tiny 32 × 20 framebuffer, one pixel per
// cell, with the colour attachment on the left and the depth attachment on
// the right (brighter = nearer). The triangles are tilted so they cross:
// red is near on the left, blue near on the right. Every setting of the
// depth test is applied per fragment, exactly as the rasterizer does it, and
// the result is compared with the correct picture pixel by pixel.
// api="gl" shows the OpenGL names (glEnable, glDepthMask, glDepthFunc…)
// instead of the Vulkan pipeline fields; the model is the same.

type Op = "LESS" | "LESS_OR_EQUAL" | "GREATER" | "ALWAYS";
type Tri = { id: "A" | "B"; p: [number, number][]; z: (x: number) => number; col: string };

const GW = 32, GH = 20, CELL = 9, GX = [14, 334], GY = 24;
const TRIS: Tri[] = [
  { id: "A", p: [[1, 1], [23, 3], [5, 19]], z: x => 0.15 + 0.7 * x / GW, col: C.red },
  { id: "B", p: [[9, 2], [31, 5], [26, 19]], z: x => 0.85 - 0.7 * x / GW, col: C.blue },
];

function inside(tri: Tri, x: number, y: number) {
  const [a, b, c] = tri.p;
  const e = (p: [number, number], q: [number, number]) => (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0]);
  const s = [e(a, b), e(b, c), e(c, a)];
  return s.every(v => v >= 0) || s.every(v => v <= 0);
}
const pass = (op: Op, z: number, stored: number) =>
  op === "LESS" ? z < stored : op === "LESS_OR_EQUAL" ? z <= stored : op === "GREATER" ? z > stored : true;

type Opts = { test: boolean; write: boolean; op: Op; clear: number; order: "AB" | "BA" };
function render(o: Opts) {
  const color: (string | null)[] = Array(GW * GH).fill(null);
  const depth: number[] = Array(GW * GH).fill(o.clear);
  let tested = 0, rejected = 0;
  const order = o.order === "AB" ? TRIS : [TRIS[1], TRIS[0]];
  for (const tri of order) {
    for (let k = 0; k < GW * GH; k++) {
      const x = (k % GW) + 0.5, y = Math.floor(k / GW) + 0.5;      // pixel centre
      if (!inside(tri, x, y)) continue;
      const z = tri.z(x);
      tested++;
      if (o.test && !pass(o.op, z, depth[k])) { rejected++; continue; }
      color[k] = tri.col;
      if (o.test && o.write) depth[k] = z;                        // no test means no depth writes either
    }
  }
  return { color, depth, tested, rejected };
}
const REF = render({ test: true, write: true, op: "LESS", clear: 1, order: "AB" }).color;

const NAMES = {
  vk: { test: "depthTestEnable", write: "depthWriteEnable", op: "depthCompareOp", prefix: "", leq: "LESS_OR_EQUAL" },
  gl: { test: "glEnable(GL_DEPTH_TEST)", write: "glDepthMask", op: "glDepthFunc", prefix: "GL_", leq: "GL_LEQUAL" },
};

export function DepthTestFigure({ t, api = "vk" }: { t?: TrackTranslations; api?: "vk" | "gl" }) {
  const [o, setO] = useState<Opts>({ test: true, write: true, op: "LESS", clear: 1, order: "AB" });
  const [probe, setProbe] = useState<number | null>(16 + 10 * GW);
  const L = (k: string, en: string) => tx(t, `figVkDepth_${k}`, en);
  const G = (k: string, en: string) => tx(t, `figGlDepth_${k}`, en);
  const N = NAMES[api];
  const set = <K extends keyof Opts>(k: K, v: Opts[K]) => setO(s => ({ ...s, [k]: v }));

  const r = render(o);
  const wrong = r.color.filter((c, k) => c !== REF[k]).length;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const p = svgPoint(e.currentTarget, e);
    for (const gx of GX) {
      const cx = Math.floor((p.x - gx) / CELL), cy = Math.floor((p.y - GY) / CELL);
      if (cx >= 0 && cx < GW && cy >= 0 && cy < GH) setProbe(cy * GW + cx);
    }
  };
  const px = probe !== null ? (probe % GW) + 0.5 : 0, py = probe !== null ? Math.floor(probe / GW) + 0.5 : 0;

  return (
    <Figure
      title={L("title", "The depth test, one fragment at a time")}
      head={<Choice value={o.order} onChange={v => set("order", v)} options={[["AB", L("orderAB", "draw red, then blue")], ["BA", L("orderBA", "draw blue, then red")]] as const} />}
      controls={<>
        <Row>
          <Btn active={o.test} onClick={() => set("test", !o.test)}>{o.test ? "☑" : "☐"} {N.test}</Btn>
          <Btn active={o.write} onClick={() => set("write", !o.write)}>{o.write ? "☑" : "☐"} {N.write}</Btn>
          <span className="text-[10px] font-mono text-[var(--text-muted)] ml-2">{api === "gl" ? "glClearDepth" : L("clear", "clear")}</span>
          <Choice value={String(o.clear) as "1" | "0"} onChange={v => set("clear", Number(v))} options={[["1", "1.0"], ["0", "0.0"]] as const} />
        </Row>
        <Row><span className="text-[10px] font-mono text-[var(--text-muted)]">{N.op}</span><Choice value={o.op} onChange={v => set("op", v)} options={[["LESS", N.prefix + "LESS"], ["LESS_OR_EQUAL", N.leq], ["GREATER", N.prefix + "GREATER"], ["ALWAYS", N.prefix + "ALWAYS"]] as const} /></Row>
        <Row>
          <Readout>{L("tested", "fragments")} {r.tested}</Readout>
          <Readout>{L("rejected", "rejected")} {r.rejected}</Readout>
          <Readout color={wrong ? C.red : C.green}>{wrong ? `${wrong} ${L("wrong", "pixels differ from the correct picture")}` : L("right", "correct picture")}</Readout>
          {probe !== null && TRIS.map(tri => inside(tri, px, py) && <Readout key={tri.id} color={tri.col}>z<sub>{tri.id === "A" ? L("red", "red") : L("blue", "blue")}</sub> = {f2(tri.z(px))}</Readout>)}
          {probe !== null && <Readout>{L("stored", "depth buffer")} = {f2(r.depth[probe])}</Readout>}
        </Row>
      </>}
      note={api === "gl"
        ? G("note", "Each cell is one pixel; its centre is tested against each triangle. The red triangle is near (small depth) on its left and the blue one near on its right, so they cross along x = 16, something no drawing order can get right: with the test off, whatever is drawn last covers the overlap. With GL_LESS and glClearDepth(1.0), the first fragment at each pixel passes (anything is less than 1) and writes its depth, and later fragments pass only if they are nearer. Untick glDepthMask and every fragment is compared with the cleared 1.0, so the last drawn wins again. Clear to 0.0 with GL_LESS and nothing passes. GL_GREATER with a clear of 0.0 is the reversed-Z setup, which is correct only with a projection that maps near to 1. Move the pointer over either grid to read the depths at one pixel.")
        : L("note", "Each cell is one pixel; its centre is tested against each triangle. The red triangle is near (small z) on its left and the blue one near on its right, so they cross along x = 16, something no drawing order can get right: with the test off, whatever is drawn last covers the overlap. With LESS and a clear of 1.0, the first fragment at each pixel passes (anything is less than 1) and writes its depth, and later fragments pass only if they are nearer. Turn depth writes off and every fragment is compared with the clear value, so the last drawn wins again. Clear to 0.0 with LESS and nothing passes; GREATER with a clear of 0.0 is the reversed-Z setup, which is correct only with a projection that maps near to 1. Move the pointer over either grid to read the depths at one pixel.")}
    >
      <svg viewBox={`0 0 640 ${GY + GH * CELL + 8}`} className="w-full h-auto touch-none" role="img" onPointerMove={onMove} onPointerDown={onMove}>
        <T x={GX[0]} y={GY - 8} size={8.5}>{api === "gl" ? G("colour", "colour buffer") : L("colour", "colour attachment")}</T>
        <T x={GX[1]} y={GY - 8} size={8.5}>{api === "gl" ? G("depth", "depth buffer (brighter = nearer)") : L("depth", "depth attachment (brighter = nearer)")}</T>
        {r.color.map((c, k) => (
          <rect key={`c${k}`} x={GX[0] + (k % GW) * CELL} y={GY + Math.floor(k / GW) * CELL} width={CELL - 0.6} height={CELL - 0.6}
            fill={c ?? "#0b0d16"} stroke={c !== REF[k] ? "#fff" : "none"} strokeWidth={c !== REF[k] ? 0.8 : 0} />
        ))}
        {r.depth.map((d, k) => {
          const g = Math.round(255 * (1 - d) * 0.9 + 12);
          return <rect key={`d${k}`} x={GX[1] + (k % GW) * CELL} y={GY + Math.floor(k / GW) * CELL} width={CELL - 0.6} height={CELL - 0.6} fill={`rgb(${g},${g},${g})`} />;
        })}
        {probe !== null && GX.map(gx => (
          <rect key={gx} x={gx + (probe % GW) * CELL - 1} y={GY + Math.floor(probe / GW) * CELL - 1} width={CELL + 1.4} height={CELL + 1.4} fill="none" stroke={C.amber} strokeWidth={1.6} />
        ))}
      </svg>
    </Figure>
  );
}
